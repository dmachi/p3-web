define([
	"dojo/_base/declare","dijit/_WidgetBase","dojo/on",
	"dojo/dom-class",
	"dojo/text!./templates/Rnaseq.html","./AppBase","dojo/dom-construct",
        "dojo/_base/Deferred","dojo/aspect","dojo/_base/lang","dojo/domReady!","dijit/form/NumberTextBox",
	"dojo/query", "dojo/dom", "dijit/popup", "dijit/Tooltip", "dijit/Dialog", "dijit/TooltipDialog",
    "dojo/NodeList-traverse","../../WorkspaceManager", "dojo/store/Memory", "dojox/widget/Standby"
], function(
	declare, WidgetBase, on,
	domClass,
	Template,AppBase,domConstruct,
        Deferred,aspect,lang,domReady,NumberTextBox,query,
	dom, popup, Tooltip, Dialog, TooltipDialog, children,WorkspaceManager, Memory, Standby
){
	return declare([AppBase], {
		"baseClass": "App Assembly",
		templateString: Template,
		applicationName: "RNASeq",
		libraryData: null,
		defaultPath: "",
		startingRows: 11,
        initConditions: 5,
        maxConditions: 10,
        conditionStore: null,

        listValues:function(obj){
            var results=[];
            Object.keys(obj).forEach(function(key){
                results.append(obj[key]);
            });
        },

		constructor: function(){

			this.addedLibs={counter:0};
			this.addedCond={counter:0};
            //these objects map dojo attach points to desired alias for ingestAttachPoint function
            //key is attach point array of values is alias
            //if there is no alias the key in the resulting object will be the same name as attach point
			this.pairToAttachPt1={"read1":null, "read2":null};
			this.pairConditionToAttachPt={"read1":null,"read2":null,"condition_paired":["condition"]};
			this.advPairToAttachPt={"interleaved":null, "insert_size_mean":null, "insert_size_stdev":null};
			this.paramToAttachPt={"output_path":null,"output_file":null, "recipe":null};
			this.singleToAttachPt={"read":null};
			this.singleConditionToAttachPt={"read":null,"condition_single":["condition"]};
            this.conditionToAttachPt={"condition":["condition","id","label"]};
            this.targetGenomeID="";
            this.shapes=["icon-square","icon-circle"];
            this.colors=["blue","green","red","purple","orange"];
            this.color_counter=0;
            this.shape_counter=0;
            this.conditionStore=new Memory({data:[]});
            this.libraryStore=new Memory({data:[]});
            this.libraryID=0;
		},
 

        startup: function(){
            if (this._started) { return; }
            this.inherited(arguments);
			var _self=this;
			_self.defaultPath = WorkspaceManager.getDefaultFolder() || _self.activeWorkspacePath;
            _self.output_path.set('value', _self.defaultPath);
            
            //create help dialog for infobutton's with infobuttoninfo div's
            this.emptyTable(this.libsTable, this.startingRows);
            this.emptyTable(this.condTable, this.initConditions);

            //adjust validation for each of the attach points associated with read files
			Object.keys(this.pairToAttachPt1).concat(Object.keys(this.singleToAttachPt)).forEach(lang.hitch(this, function(attachname){
				this[attachname].searchBox.validator = lang.hitch(this[attachname].searchBox, function(/*anything*/ value, /*__Constraints*/ constraints){
					return (new RegExp("^(?:" + this._computeRegexp(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
					(!this._isEmpty(value)) &&
					(this._isEmpty(value) || this.parse(value, constraints) !== undefined); // Boolean
				}
			)}));
			var handle = on(this.group_switch, "click", lang.hitch(this,function(evt){
                this.exp_design.checked= !this.exp_design.checked ? true : false;
                this.exp_design.value= this.exp_design.checked ? "on" : "off";
                this.onDesignToggle();
            }));
            this.condition_single.labelFunc=this.showConditionLabels;
            this.condition_paired.labelFunc=this.showConditionLabels;
            // this.block_condition.show();
				
			//this.read1.set('value',"/" +  window.App.user.id +"/home/");
			//this.read2.set('value',"/" +  window.App.user.id +"/home/");
			//this.single_end_libs.set('value',"/" +  window.App.user.id +"/home/");
			//this.output_path.set('value',"/" +  window.App.user.id +"/home/");
			this._started=true;
		},

        onDesignToggle:function(){
            var disable = !this.exp_design.checked;
            this.condition.set("disabled",disable);
            this.condition_single.set("disabled",disable);
            this.condition_paired.set("disabled",disable);
            if(disable){
                // this.block_condition.show();
                this.numCondWidget.set('value',Number(1));
                this.destroyLibRow(query_id=true, id_type="design");
                dojo.addClass(this.condTable,"disabled");
            }
            else {
                // this.block_condition.hide();
                this.numCondWidget.set('value',Number(this.addedCond.counter));
                this.destroyLibRow(query_id=false, id_type="design");
                dojo.removeClass(this.condTable,"disabled");
            }
        },

        emptyTable:function(target, rowLimit){
			for (i = 0; i < rowLimit; i++) { 
				var tr =  target.insertRow(0);//domConstr.create("tr",{},this.libsTableBody);
				var td = domConstruct.create('td', {innerHTML: "<div class='emptyrow'></div>"},tr);
				var td2 = domConstruct.create("td", {innerHTML: "<div class='emptyrow'></div>"},tr);
				var td3 = domConstruct.create("td", {innerHTML: "<div class='emptyrow'></div>"},tr);
			}
        },

		getValues:function(){
			if (typeof String.prototype.startsWith != 'function') {
				String.prototype.startsWith = function (str){
    					return this.slice(0, str.length) == str;
  				};
			}
			var assembly_values={};
			var values = this.inherited(arguments);
			var pairedList = this.libraryStore.query({"type":"paired"});
            var pairedAttrs=["read1","read2"];
            var singleAttrs=["read"];
			var condList = this.conditionStore.data;	
			var singleList = this.libraryStore.query({"type":"single"});
            var condLibs=[];
			var pairedLibs =[];
			var singleLibs=[];
			this.ingestAttachPoints(this.paramToAttachPt, assembly_values);	
			//for (var k in values) {
			//	if(!k.startsWith("libdat_")){
			//		assembly_values[k]=values[k];
			//	}
			//}
            var combinedList = pairedList.concat(singleList);
            assembly_values["reference_genome_id"]=values["genome_name"];
            if(this.exp_design.checked){
			    condList.forEach(function(condRecord){
                    for(var i =0; i < combinedList.length; i++){
                        if(combinedList[i].condition == condRecord.condition){
				            condLibs.push(condRecord.condition);
                            break;
                        }
                    }
                });
            }

			pairedList.forEach(function(libRecord){
                var toAdd={};
                if('condition' in libRecord && this.exp_design.checked){
                    toAdd['condition']=condLibs.indexOf(libRecord['condition'])+1;
                }
                pairedAttrs.forEach(function(attr){toAdd[attr]=libRecord[attr]});
				pairedLibs.push(toAdd);
            },this);
			if(pairedLibs.length){
				assembly_values["paired_end_libs"]=pairedLibs;
			}
			if(condLibs.length){
				assembly_values["experimental_conditions"]=condLibs;
			}
			singleList.forEach(function(libRecord){
                var toAdd={};
                if('condition' in libRecord && this.exp_design.checked){
                    toAdd['condition']=condLibs.indexOf(libRecord['condition'])+1;
                }
                singleAttrs.forEach(function(attr){toAdd[attr]=libRecord[attr]});
				singleLibs.push(toAdd);
            },this);
			if(singleLibs.length){
				assembly_values["single_end_libs"]=singleLibs;
			}
			return assembly_values;
				
		},
        //gets values from dojo attach points listed in input_ptsi keys.
        //aliases them to input_pts values.  validates all values present if req
		ingestAttachPoints: function(input_pts, target, req){
            req = typeof req !== 'undefined' ? req : true;
			var success=1;
            var prevalidate_ids=["read1","read2","read","output_path","condition","condition_single","condition_paired"];
			Object.keys(input_pts).forEach(function(attachname){
				var cur_value=null;
				var incomplete =0;
				var prevalidate=(prevalidate_ids.indexOf(attachname) > -1);//truth variable whether to do validation separate from form
                var targetnames=[attachname];
                if (input_pts[attachname]){
                    targetnames=input_pts[attachname];
                }
				if(attachname == "read1" || attachname == "read2" || attachname == "read" || attachname == "output_path"){
					cur_value=this[attachname].searchBox.value;//? "/_uuid/"+this[attachname].searchBox.value : "";
                    if(attachname == "read2" && this["read2"].searchBox.value == this["read1"].searchBox.value){
                        this["read2"].searchBox.value="";
                    }
					//cur_value=this[attachname].searchBox.get('value');
					//incomplete=((cur_value.replace(/^.*[\\\/]/, '')).length==0);
				}
				else if(attachname == "condition"){
					cur_value=this[attachname].displayedValue;//? "/_uuid/"+this[attachname].searchBox.value : "";
					//cur_value="/_uuid/"+this[attachname].searchBox.value;
					//cur_value=this[attachname].searchBox.get('value');
				}
				else{
					cur_value=this[attachname].value;
				}
					
				if(typeof(cur_value) == "string"){
					cur_value=cur_value.trim();
				}
                //set validation state for widgets since they are non-blocking presubmission fields
				if(req && (!cur_value || incomplete)){
					if(prevalidate){
                        if(this[attachname].searchBox){
						    this[attachname].searchBox.validate(); //this should be whats done but it doesn't actually call the new validator
						    this[attachname].searchBox._set("state","Error");
                        }
                        else{
                            this[attachname].validate();
                            this[attachname]._set("state","Error");
                        }
						this[attachname].focus=true;
					}
					success=0;
				}
				else{
					this[attachname]._set("state","");
				}
                //set alias target values to cur_value and format values in resulting object
                targetnames.forEach(function(targetname){
                    target[targetname]=cur_value;
                    if(target[targetname]!=""){
                        target[targetname]= target[targetname] || undefined;
                    }
                    else if (target[targetname] == "true"){
                        target[targetname]=true;
                    }
                    else if (target[targetname]=="false"){
                        target[targetname]=false;
                    }
                }, target);
			}, this);
			return(success);
		},
        showConditionLabels: function(item, store){
            var label=item.condition+" "+item.icon;
            return label;
        },
		makePairName:function(libRecord){
			var fn =this.read1.searchBox.get("displayedValue");
			var fn2 =this.read2.searchBox.get("displayedValue");
			var maxName=14; 
			if(fn.length > maxName){
				fn=fn.substr(0,(maxName/2)-2)+".."+fn.substr((fn.length-(maxName/2))+2);
			}
			if(fn2.length > maxName){
				fn2=fn2.substr(0,(maxName/2)-2)+".."+fn2.substr((fn2.length-(maxName/2))+2);
			}
			return "P("+fn+", "+fn2+")";
		},	
			

        makeConditionName:function(){
            return this.condition.get("displayedValue");
        },
		makeSingleName:function(libRecord){
			var fn =this.read.searchBox.get("displayedValue");
                        maxName=24
			if(fn.length > maxName){
				fn=fn.substr(0,(maxName/2)-2)+".."+fn.substr((fn.length-(maxName/2))+2);
			}
			return "S("+fn+")";
		},

        //counter is a widget for requirements checking
		increaseRows: function(targetTable, counter, counterWidget){
			counter.counter= counter.counter+1;
            if (typeof counterWidget != "undefined"){
			    counterWidget.set('value',Number(counter.counter));
            }
		},
		decreaseRows: function(targetTable, counter, counterWidget){
			counter.counter = counter.counter-1;
            if (typeof counterWidget != "undefined"){
			    counterWidget.set('value',Number(counter.counter));
            }
		},
        getConditionIcon: function(query_id){
            var result="";
            if(!query_id){
                result="<i style='color:"+this.colors[this.color_counter]+"' class='fa "+this.shapes[this.shape_counter]+" fa-1x' />";
                this.color_counter = this.color_counter+1 < this.colors.length ? this.color_counter+1 : 0;
                this.shape_counter = this.shape_counter+1 < this.shapes.length ? this.shape_counter+1 : 0;
            }
            else{
                var conditionList=this.conditionStore.query({id:query_id});
                result=conditionList.length ? conditionList[0].icon : "<i class='fa fa-info fa-1' />";
            }
            return result;
        },


		onAddCondition: function(){
			console.log("Create New Row", domConstruct);
			var lrec={};
            var toIngest=this.conditionToAttachPt;
            var disable = !this.exp_design.checked;
			var chkPassed=this.ingestAttachPoints(toIngest, lrec);
            var conditionSize = this.conditionStore.data.length;
            if (this.addedCond.counter < this.maxConditions){
                this.updateConditionStore(record=lrec, remove=false);
            }
            //make sure all necessary fields, not disabled, available condition slots, and checking conditionSize checks dups
			if (chkPassed && ! disable && this.addedCond.counter < this.maxConditions && conditionSize < this.conditionStore.data.length){
                lrec["icon"]=this.getConditionIcon();
				var tr = this.condTable.insertRow(0);
				var td = domConstruct.create('td', {"class":"textcol conditiondata", innerHTML:""},tr);
				td.libRecord=lrec;
				td.innerHTML="<div class='libraryrow'>"+this.makeConditionName()+"</div>";
				var tdinfo=domConstruct.create("td", {"class":"iconcol", innerHTML: lrec["icon"]},tr);
				var td2 = domConstruct.create("td", {"class":"iconcol",innerHTML: "<i class='fa fa-times fa-1x' />"},tr);
				if(this.addedCond.counter < this.initConditions){
					this.condTable.deleteRow(-1);
				}
                   
				var handle = on(td2, "click", lang.hitch(this,function(evt){
					console.log("Delete Row");
					domConstruct.destroy(tr);
                    this.updateConditionStore(record=lrec,remove=true);
					this.decreaseRows(this.condTable, this.addedCond, this.numCondWidget);
					if (this.addedCond.counter < this.maxConditions){
						var ntr = this.condTable.insertRow(-1);	
						var ntd = domConstruct.create('td', {innerHTML: "<div class='emptyrow'></div>"},ntr);
						var ntd2 = domConstruct.create("td", {innerHTML: "<div class='emptyrow'></div>"},ntr);
						var ntd3 = domConstruct.create("td", {innerHTML: "<div class='emptyrow'></div>"},ntr);
                    }
                    this.condition_single.reset();
                    this.condition_paired.reset();
					handle.remove();
                    this.destroyLibRow(query_id=lrec["condition"],id_type="condition");
				}));
				this.increaseRows(this.condTable, this.addedCond, this.numCondWidget);
			}
		},

        updateConditionStore: function(record,remove){
            // if there is no real condition specified return
            if (! record.condition.trim() || ! record.condition) {
                return;
            }
            if (remove){
                var toRemove=this.conditionStore.query({id:record["id"]});
                //remove condition from data store
                toRemove.forEach(function(obj){
                    if(obj.libraries){
                        libraries.forEach(function(lib_row){
                            lib_row.remove();
                        });
                    }
                    this.conditionStore.remove(obj.id);
                },this);
            }
            else {
                this.conditionStore.put(record);
            }
            this.condition_paired.set("store",this.conditionStore);
            this.condition_single.set("store",this.conditionStore);
        },

		onAddSingle: function(){
			console.log("Create New Row", domConstruct);
            this.libraryID+=1;
			var lrec={};
			var toIngest= this.exp_design.checked ? this.singleConditionToAttachPt : this.singleToAttachPt;
			var chkPassed=this.ingestAttachPoints(toIngest, lrec);
			if (chkPassed){
				var tr = this.libsTable.insertRow(0);
                lrec["id"]=this.libraryID;
                lrec["row"]=tr;
                lrec["type"]="single";
				var td = domConstruct.create('td', {"class":"textcol singledata", innerHTML:""},tr);
				//td.libRecord=lrec;
				td.innerHTML="<div class='libraryrow'>"+this.makeSingleName()+"</div>";
				var advPairInfo= [];
				if(lrec["condition"]){
					advPairInfo.push("Condition:"+lrec["condition"]);
				}
				if(advPairInfo.length){
                    condition_icon=this.getConditionIcon(lrec["condition"]);
                    lrec["design"]=true;
					var tdinfo=domConstruct.create("td", {"class":"iconcol",innerHTML: condition_icon},tr);
					var ihandle=new Tooltip({
						connectId: [tdinfo],
						label: advPairInfo.join("</br>") 
					});
				}
				else{
                    lrec["design"]=false;
					var tdinfo=domConstruct.create("td", {innerHTML: ""},tr);
				}
				var td2 = domConstruct.create("td", {"class":"iconcol", innerHTML: "<i class='fa fa-times fa-1x' />"},tr);
				if(this.addedLibs.counter < this.startingRows){
					this.libsTable.deleteRow(-1);
				}
				var handle = on(td2, "click", lang.hitch(this,function(evt){
                    this.destroyLibRow(query_id=lrec["id"], "id")
				}));
                lrec["handle"]=handle;
                this.libraryStore.put(lrec);
				this.increaseRows(this.libsTable, this.addedLibs, this.numlibs);
			}
		},

        destroyLibRow:function(query_id, id_type){
            console.log("Delete Rows");
            var query_obj={};
            query_obj[id_type]=query_id;
            var toRemove=this.libraryStore.query(query_obj);
            toRemove.forEach(function(obj){
                domConstruct.destroy(obj.row);
                this.decreaseRows(this.libsTable, this.addedLibs, this.numlibs);
                if (this.addedLibs.counter < this.startingRows){
                    var ntr = this.libsTable.insertRow(-1);	
                    var ntd = domConstruct.create('td', {innerHTML: "<div class='emptyrow'></div>"},ntr);
                    var ntd2 = domConstruct.create("td", {innerHTML: "<div class='emptyrow'></div>"},ntr);
                    var ntd3 = domConstruct.create("td", {innerHTML: "<div class='emptyrow'></div>"},ntr);
                }	
                obj.handle.remove();
                this.libraryStore.remove(obj.id);
            },this);
        },

        onSuggestNameChange: function(){
        },

		
		onAddPair: function(){
			console.log("Create New Row", domConstruct);
            this.libraryID+=1;
			var lrec={};
			//If you want to disable advanced parameters while not shown this would be the place.
			//but for right now, if you set them and then hide them, they are still active
			var pairToIngest= this.exp_design.checked ? this.pairConditionToAttachPt : this.pairToAttachPt1;
			//pairToIngest=pairToIngest.concat(this.advPairToAttachPt);	
			var chkPassed=this.ingestAttachPoints(pairToIngest, lrec);
			//this.ingestAttachPoints(this.advPairToAttachPt, lrec, false)
			if (chkPassed && lrec.read1 != lrec.read2){
				var tr = this.libsTable.insertRow(0);
                lrec["id"]=this.libraryID;
                lrec["row"]=tr;
                lrec["type"]="paired";
				var td = domConstruct.create('td', {"class":"textcol pairdata", innerHTML:""},tr);
				td.libRecord=lrec;
				td.innerHTML="<div class='libraryrow'>"+this.makePairName()+"</div>";
				var advPairInfo= [];
				if(lrec["condition"]){
					advPairInfo.push("Condition:"+lrec["condition"]);
				}
				if(advPairInfo.length){
                    lrec["design"]=true;
                    condition_icon=this.getConditionIcon(lrec["condition"]);
					var tdinfo=domConstruct.create("td", {"class":"iconcol",innerHTML: condition_icon},tr);
					var ihandle=new Tooltip({
						connectId: [tdinfo],
						label: advPairInfo.join("</br>") 
					});
				}
				else{
                    lrec["design"]=false;
					var tdinfo=domConstruct.create("td", {innerHTML: ""},tr);
				}
				var td2 = domConstruct.create("td", {"class":"iconcol",innerHTML: "<i class='fa fa-times fa-1x' />"},tr);
				if(this.addedLibs.counter < this.startingRows){
					this.libsTable.deleteRow(-1);
				}
				var handle = on(td2, "click", lang.hitch(this,function(evt){
                    this.destroyLibRow(query_id=lrec["id"], id_type="id")
				}));
                lrec["handle"]=handle;
                this.libraryStore.put(lrec);
				this.increaseRows(this.libsTable, this.addedLibs, this.numlibs);
			}
		}
		
	});
});

