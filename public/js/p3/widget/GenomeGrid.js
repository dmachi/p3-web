define([
	"dojo/_base/declare","dijit/layout/BorderContainer","dojo/on",
	"dojo/dom-class","dijit/layout/ContentPane","dojo/dom-construct",
	"./PageGrid","./formatter"
], function(
	declare, BorderContainer, on,
	domClass,ContentPane,domConstruct,
	Grid,formatter
){
	return declare([Grid], {
		region: "center",
		query: (this.query||""),
		apiToken: window.App.authorizationToken,
		apiServer: window.App.dataAPI,
		dataModel: "genome",
		primaryKey: "genome_id",
		deselectOnRefresh: true,
		columns: {
			genome_id: {label:'Genome ID', field:'genome_id', hidden:true},
			genome_name: {label:'Genome Name', field:'genome_name', formatter: formatter.linkGenome},
			taxon_id: {label:'NCBI Taxon ID', field:'taxon_id', hidden:true},
			genome_status: {label:'Genome Status', field:'genome_status'},
			/* genome_browser: {label:'Genome Browser', field:'genome_id', formatter:renderGenomeBrowserByGenome}, */
			genome_length: {label:'Size', field:'genome_length', hidden:true},
			chromosomes: {label:'Chromosome', field:'chromosomes', hidden:true},
			plasmids: {label:'Plasmids', field:'plasmids', hidden:true},
			contigs: {label:'Contigs', field:'contigs', hidden:true},
			sequences: {label:'Sequences', field:'sequences', hidden:true /*, formatter:renderTotal*/},
			patric_cds: {label:'PATRIC CDS', field:'patric_cds', formatter:formatter.linkGenomePATRICCDS},
			brc1_cds: {label:'BRC1 CDS', field:'brc1_cds', hidden:true, formatter:formatter.linkGenomeBRC1CDS},
			refseq_cds: {label:'RefSeq CDS', field:'refseq_cds', hidden:true, formatter:formatter.linkGenomeRefSeqCDS},
			isolation_country: {label:'Isolation Country', field:'isolation_country'},
			host_name: {label:'Host Name', field:'host_name'},
			disease: {label:'Disease', field:'disease', sortable: false},
			collection_date: {label:'Collection Date', field:'collection_date'},
			completion_date: {label:'Completion Date', field:'completion_date', formatter: formatter.dateOnly},
			mlst: {label:'MLST', field:'mlst', hidden:true},
			other_typing: {label:'Other Typing', field:'other_typing', hidden:true},
			strain: {label:'Strain', field:'strain', hidden:true},
			serovar: {label:'Serovar', field:'serovar', hidden:true},
			biovar: {label:'Biovar', field:'biovar', hidden:true},
			pathovar: {label:'Pathovar', field:'pathovar', hidden:true},
			culture_collection: {label:'Culture Collection', field:'culture_collection', hidden:true},
			type_strain: {label:'Type Strain', field:'type_strain', hidden:true},
			sequencing_centers: {label:'Sequencing Center', field:'sequencing_centers', hidden:true},
			publication: {label:'Publication', field:'publication', hidden:true},
			bioproject_accession: {label:'BioProject Accession', field:'bioproject_accession', hidden:true},
			biosample_accession: {label:'BioSample Accession', field:'biosample_accession', hidden:true},
			assembly_accession: {label:'Assembly Accession', field:'assembly_accession', hidden:true},
			genbank_accessions: {label:'GenBank Accessions', field:'genbank_accessions', hidden:true},
			refseq_accessions: {label:'RefSeq Accessions', field:'refseq_accessions', hidden:true},
			sequencing_platform: {label:'Sequencing Platform', field:'sequencing_platform', hidden:true},
			sequencing_depth: {label:'Sequencing Depth', field:'sequencing_depth', hidden:true},
			assembly_method: {label:'Assembly Method', field:'assembly_method', hidden:true},
			gc_content: {label:'GC Content', field:'gc_content', hidden:true},
			isolation_site: {label:'Isolation Site', field:'isolation_site', hidden:true},
			isolation_source: {label:'Isolation Source', field:'isolation_source', hidden:true},
			isolation_comments: {label:'Isolation Comments', field:'isolation_comments', hidden:true},
			geographic_location: {label:'Geographic Location', field:'geographic_location', hidden:true},
			latitude: {label:'Latitude', field:'latitude', hidden:true},
			longitude: {label:'Longitude', field:'longitude', hidden:true},
			altitude: {label:'Altitude', field:'altitude', hidden:true},
			depth: {label:'Depth', field:'depth', hidden:true},
			other_environmental: {label:'Other Environmental', field:'other_environmental', hidden:true},
			host_gender: {label:'Host Gender', field:'host_gender', hidden:true},
			host_age: {label:'Host Age', field:'host_age', hidden:true},
			host_health: {label:'Host Health', field:'host_health', hidden:true},
			body_sample_site: {label:'Body Sample Site', field:'body_sample_site', hidden:true},
			body_sample_subsite: {label:'Body Sample Subsite', field:'body_sample_subsite', hidden:true},
			other_clinical: {label:'Other Clinical', field:'other_clinical', hidden:true},
			antimicrobial_resistance: {label:'Antimicrobial Resistance', field:'antimicrobial_resistance', hidden:true},
			antimicrobial_resistance_evidence: {label:'Antimicrobial Resistance Evidence', field:'antimicrobial_resistance_evidence', hidden:true},
			gram_stain: {label:'Gram Stain', field:'gram_stain', hidden:true},
			cell_shape: {label:'Cell Shape', field:'cell_shape', hidden:true},
			motility: {label:'Motility', field:'motility', hidden:true},
			sporulation: {label:'Sporulation', field:'sporulation', hidden:true},
			temperature_range: {label:'Temperature Range', field:'temperature_range', hidden:true},
			optimal_temperature: {label:'Optimal Temperature', field:'optimal_temperature', hidden:true},
			salinity: {label:'Salinity', field:'salinity', hidden:true},
			oxygen_requirement: {label:'Oxygen Requirement', field:'oxygen_requirement', hidden:true},
			habitat: {label:'Habitat', field:'habitat', hidden:true},
			comments: {label:'Comments', field:'comments', hidden:true},
			additional_metadata: {label:'Additional Metadata', field:'additional_metadata', hidden:true}
		},
		startup: function(){
				var _self = this
                                this.on(".dgrid-content .dgrid-row:dblclick", function(evt) {
                                    var row = _self.row(evt);
                                    console.log("dblclick row:", row)
                                        on.emit(_self.domNode, "ItemDblClick", {
                                                item_path: row.data.path,
                                                item: row.data,
                                                bubbles: true,
                                                cancelable: true
                                        });
                                        console.log('after emit');
                                    //if (row.data.type == "folder"){
                //                              Topic.publish("/select", []);

                //                              Topic.publish("/navigate", {href:"/workspace" + row.data.path })
                //                              _selection={};
                                        //}
                                });
                                //_selection={};
                                //Topic.publish("/select", []);

                                this.on("dgrid-select", function(evt) {
                                        console.log('dgrid-select: ', evt);
                                        var newEvt = {
                                                rows: evt.rows,
                                                selected: evt.grid.selection,
                                                grid: _self,
                                                bubbles: true,
                                                cancelable: true
                                        }
                                        on.emit(_self.domNode, "select", newEvt);
                                        //console.log("dgrid-select");
                                        //var rows = evt.rows;
                                        //Object.keys(rows).forEach(function(key){ _selection[rows[key].data.id]=rows[key].data; });
                                        //var sel = Object.keys(_selection).map(function(s) { return _selection[s]; });
                                        //Topic.publish("/select", sel);
                                });
                                this.on("dgrid-deselect", function(evt) {
                                        console.log("dgrid-select");
                                        var newEvt = {
                                                rows: evt.rows,
                                                selected: evt.grid.selection,
                                                grid: _self,
                                                bubbles: true,
                                                cancelable: true
                                        }
                                        on.emit(_self.domNode, "deselect", newEvt);
                                        return;
                                });
				this.inherited(arguments);
				this.refresh();
		}
	});
});
