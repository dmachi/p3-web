define([
	"dojo/_base/declare","./TabViewerBase","dojo/on", "dojo/_base/lang",
	"dojo/dom-class","dijit/layout/ContentPane","dojo/dom-construct","dojo/topic",
	"../formatter","dijit/layout/TabContainer","../GenomeOverview",
	"dojo/request","dojo/_base/lang","../FeatureGridContainer","../SpecialtyGeneGridContainer",
	"../ActionBar","../ContainerActionBar","../PathwaysContainer","../ProteinFamiliesContainer",
	"../DiseaseContainer","../PublicationGridContainer","../CircularViewerContainer",
	"../TranscriptomicsContainer"/*,"JBrowse/Browser"*/,"../InteractionsContainer","../GenomeGridContainer"
], function(
	declare, TabViewerBase, on, lang,
	domClass,ContentPane,domConstruct,Topic,
	formatter,TabContainer,GenomeOverview,
	xhr,lang,FeatureGridContainer,SpecialtyGeneGridContainer,
	ActionBar,ContainerActionBar,PathwaysContainer,ProteinFamiliesContainer,
	DiseaseContainer,PublicationGridContainer,CircularViewerContainer,
	TranscriptomicsContainer/*, JBrowser*/,InteractionsContainer,GenomeGridContainer
){
	return declare([TabViewerBase], {
		paramsMap: "query",
		maxGenomesPerList: 200,
		constructor: function(){
			console.log(this.id, "GenomeList ctor() this: ", this);
		},

		_setQueryAttr: function(query){
			// console.log(this.id, " _setQueryAttr: ", query, this);
			//if (!query) { console.log("GENOME LIST SKIP EMPTY QUERY: ");  return; }
			// console.log("GenomeList SetQuery: ", query, this);		
			if (query == this.query){
				console.log("GenomeList: Skip Unchanged query", query);
				return;
			}

			this.query = query; // || "?keyword(*)";

			if (!this._started) { return; }

			var _self=this;

			var url = this.apiServiceUrl + "/genome/" + (this.query||"?") + "&select(genome_id)&limit(" + this.maxGenomesPerList + ")"

			xhr.get(url,{
				headers: {
					accept: "application/solr+json"
				},
				handleAs: "json"	
			}).then(function(res) {
				console.log(" URL: ", url);
				console.log("Get GenomeList Res: ", res);
				if (res && res.response && res.response.docs){
					var genomes = res.response.docs;
					if (genomes){
						_self.genome_ids = genomes.map(function(o) { return o.genome_id; });
						_self.refresh();
					}
				}else{
					console.log("Invalid Response for: ", url.substr(0,35)+ "...");
				}
			}, function(err){
				console.log("Error Retreiving Genomes: ", err)
			});

		},

		refresh: function(){
			var _self=this;

			if (_self.viewHeader){
				var l=this.genome_ids.length + " Genomes";
				if (l >= this.maxGenomesPerList-1){
						l = "First " + this.maxGenomesPerList + " matching Genomes"
				}
				this.viewHeader.set("content", '<div style="margin:4px;">Genome List Query: ' + this.query + " (" + l +" )</div>")
			}
			if (_self.genomes){ _self.genomes.set("query", "?in(genome_id,(" + _self.genome_ids.join(",") + "))") }
			//if (_self.genomes) { _self.genomes.set("query", this.query); }
			if (_self.features){ _self.features.set("query", "?in(genome_id,(" + _self.genome_ids.join(",") + "))"); }
			if (_self.specialtyGenes){ _self.specialtyGenes.set("query", "?in(genome_id,(" + _self.genome_ids.join(",") + "))"); }

		},

		createOverviewPanel: function(){
			return new ContentPane({content: "Overview", title: "Overview",id: this.viewer.id + "_" + "overview"});
		},

		postCreate: function(){
			this.inherited(arguments);
			console.log(this.id, " postCreate(): ", this)
			this.viewHeader.set("content", '<div style="margin:4px;">Genome List</div>')
			this.overview = this.createOverviewPanel();

			this.phylogeny= new ContentPane({content: "Phylogeny", title: "Phylogeny",id: this.viewer.id + "_" + "phylogeny"});
			this.genomes= new GenomeGridContainer({title: "Genomes",id: this.viewer.id + "_" + "genomes"});

			this.features = new FeatureGridContainer({title: "Features", id: this.viewer.id + "_" + "features"});
			this.specialtyGenes= new SpecialtyGeneGridContainer({title: "Specialty Genes",id: this.viewer.id + "_" + "specialtyGenes"});
			this.pathways= new PathwaysContainer({title: "Pathways",id: this.viewer.id + "_" + "pathways"});
			this.proteinFamilies= new ProteinFamiliesContainer({title: "Protein Families",id: this.viewer.id + "_" + "proteinFamilies"});
			this.transcriptomics= new TranscriptomicsContainer({title: "Transcriptomics",id: this.viewer.id + "_" + "transcriptomics"});

			this.viewer.addChild(this.overview);
			this.viewer.addChild(this.phylogeny);
			this.viewer.addChild(this.genomes);
			this.viewer.addChild(this.features);
			this.viewer.addChild(this.specialtyGenes);
			this.viewer.addChild(this.pathways);
			this.viewer.addChild(this.proteinFamilies);
			this.viewer.addChild(this.transcriptomics);

			// on(this.domNode, "SetAnchor", lang.hitch(this, function(evt){
			// 		evt.stopPropagation();
			// 		console.log(this.id, " Call onSetAnchor " , this);
			// 		this.onSetAnchor(evt);
			// }));

//			this.genomeBrowser= new JBrowser({
//				title: "Genome Browser",
////				include: [],
////				css: [],
//				dataRoot: "/public/js/jbrowse.repo/sample_data/json/volvox",
//				nameUrl: "{dataRoot}/names/meta.json",
//				containerID: this.id + "_jbrowse",
//				updateBrowserURL:false,
//				stores: { url: { type: "JBrowse/Store/SeqFeature/FromConfig", features: [] } },
//			});
	
		},
		onSetAnchor: function(evt){
			console.log("onSetAnchor: ", evt, evt.filter);
			evt.stopPropagation();
			evt.preventDefault();
			var f = evt.filter;
			var parts = []
			if (this.query) { 
				var q = (this.query.charAt(0)=="?")?this.query.substr(1):this.query;
				if (q!="keyword(*)"){
					parts.push(q) 
				}
			}
			if (evt.filter) { parts.push(evt.filter) }

			console.log("parts: ", parts);

			if (parts.length > 1){
				q = "?and(" + parts.join(",") + ")"
			}else if (parts.length==1){
				q = "?" + parts[0]
			}else{
				q = "";
			}



			console.log("SetAnchor to: ", q);
			var hp;
			if (this.hashParams && this.hashParams.view_tab){
				hp = {view_tab: this.hashParams.view_tab}
			}else{
				hp = {}
			}
			l= window.location.pathname + q + "#" + Object.keys(hp).map(function(key){
				return key + "=" + hp[key]
			},this).join("&");
			console.log("NavigateTo: ", l);
            Topic.publish("/navigate", {href: l});
		},
	});
});
