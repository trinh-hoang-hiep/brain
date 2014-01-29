/**
 * Copyright 2013 Israel Freitas (israel.araujo.freitas@gmail.com)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Log = {
  elem: false,
  info: function(text){
	  if (!this.elem) this.elem = document.getElementById('log');
	  this.elem.style.color	='#23A4FF';
	  this.elem.innerHTML   = text;
	  this.elem.style.left  = (550 - this.elem.offsetWidth / 2) + 'px';
  },
  error: function(text){
	  if (!this.elem) this.elem = document.getElementById('log');
	  this.elem.style.color	='red';
	  this.elem.innerHTML   = text;
	  this.elem.style.left  = (550 - this.elem.offsetWidth / 2) + 'px';  
  }
};

const ObjectManager = {
	lastClicked: null,
	getLastClicked: function(){ return this.lastClicked; },
	setLastClicked: function(lastClicked){ this.lastClicked = lastClicked; }
}


var st = null
function initTree(json){
    st = new $jit.ST({
   		injectInto: 'infovis',
   		background:false,
   		orientation: 'top',
   	    duration: 800,
        transition: $jit.Trans.Quart.easeInOut,
        levelsToShow: 5,
        levelDistance: 50,
        Navigation: {  
            enable: true,  
            panning: 'avoid nodes',  
            zooming: false  
          },
        
        Node: {
            height: 20,
            width: 80,
            //color: '#6D89D5',
            type: 'rectangle',
            align: "right",  
            overridable: true,
            CanvasStyles:{
            	shadowColor: 'gray',
                shadowBlur: 10,
                shadowOffsetY: 3
            }
        },
        
        Edge: {
            //type: 'bezier',
            color: '#A7B6FF',
            overridable: true,
            CanvasStyles:{
            	shadowColor: 'gray',
                shadowBlur: 10,
                shadowOffsetY: 3
            }
        },
        
        onBeforeCompute: function(node){
        	if(node) Log.info("loading " + node.name);
        },
        
        onAfterCompute: function(){
            Log.info("done");
        },
        
        onCreateLabel: function(label, node){
        	Ext.EventManager.on(label, 'contextmenu', function(e,t){
        		e.preventDefault();
        		window.getSelection().removeAllRanges();
        		ObjectManager.setLastClicked(node);
        		contextMenu.showAt(e.getXY());
        	});
        	Ext.EventManager.on(label, 'dblclick', function(e,t){
        		e.preventDefault();
        		window.getSelection().removeAllRanges();
        		knowledgeExtWrapper.update();
        	});
        	
            label.id          = node.id;            
            label.innerHTML   = node.name;
            
            var style         = label.style;
            style.width       = 80 + 'px';
            style.height      = 20 + 'px';
            style.color       = 'white';
            style.textAlign   = 'center';
            style.fontWeight  = 'bold';
            style.fontFamily  = 'tahoma,arial,verdana,sans-serif';
            style.fontSize    = '11px';
            style.overflow    = "hidden";
            style.cursor      = 'pointer';
        },
        
        Events: {  
            enable: true,
            
            onClick: function(node, eventInfo, e){
            	if(node){
            		ObjectManager.setLastClicked(node);
            		st.onClick(node.id);
            	}
            }
        },
        
        onBeforePlotNode: function(node){
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = '#23A4FF';
            }
            else {
                delete node.data.$color;
                var count = 0;
                node.eachSubnode(function(n) { count++; });
                //assign a node color based on how many children it has
                node.data.$color = ['#6D89D5', '#476DD5', '#133CAC', '#2B4281', '#062270', '#090974'][count];                    
            }
        },
        
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = '#23A4FF';
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    
    st.add = function(newKnowledge){
    	lastClikedNode = ObjectManager.lastClicked;
		st.addSubtree(
				{ id : lastClikedNode.id, children : [ newKnowledge ] }, 
				'replot',
				{ hideLabels : false, duration : 700 }
		);
		if (st.clickedNode.id != lastClikedNode.id) {
			st.onClick(lastClikedNode.id, { duration : 800 });
		}
		Log.info("Knowledege named '" + newKnowledge.name + "' added successfully.")
    };
    
    st.remove = function(knowledge){
    	lastClickedNode = ObjectManager.lastClicked;
    	st.removeSubtree(
				lastClickedNode.id,
				true,
				'animate',
				{
					duration : 500,
					hideLabels : false,
					onComplete : function() {
						Log.info("Knowledge '"+knowledge.name+"' deleted successfully.");
					}
				})
    };
    
    st.rename = function(knowledge, newName){
    	try{
    		ObjectManager.lastClicked.name = newName;
    		document.getElementById(knowledge.id).innerHTML = newName;
    		Log.info("Knowledege '"+knowledge.name+"' renamed to '" + newName + "' successfully.");
    	}
    	catch(e){
    		Log.error("Unable to rename Knowledege '"+knowledge.name+"'. Cause: "+e);
    	}
    }
    
    try{
    	st.loadJSON(json);
    	st.compute();
    	st.geom.translate(new $jit.Complex(0, -300), "current");//optional: make a translation of the tree
    	st.onClick(st.root);
    }
    catch(e){
    	Log.error("Unable to load the tree. Cause: " + e)
    }
    
}

Ext.application({
    name: 'Brain',
    launch: function() {
        Ext.create('Ext.container.Viewport', {
            layout: 'border',
            items: [
                {
			        region: 'north',
			        html: '<h1 style="color:#4574ad">&nbsp;Brain</h1>',
			        border: true,
			        margins: '5 5 5 5'
			    }, {
			        region: 'west',
			        title: 'Help',
			        iconCls:'help',
			        width: 300,
			        margins: '0 5 0 5',
			        layout: 'accordion',
			        items:[
//						{
//							xtype:'panel',
//							title: 'Abstract',
//							bodyPadding: 5,
//							layout:'fit',
//							border:false,
//							autoScroll:true,
//							contentEl:'abstract'
//						},
						{
							xtype:'panel',
							title: 'Modeling',
							bodyPadding: 5,
							layout:'fit',
							border:false,
							autoScroll:true,
							contentEl:'modeling'
						},
						{
							xtype:'panel',
							title: 'Training',
							bodyPadding: 5,
							layout:'fit',
							border:false,
							autoScroll:true,
							contentEl:'training'
						},
						{
							xtype:'panel',
							title: 'Applying',
							bodyPadding: 5,
							layout:'fit',
							border:false,
							autoScroll:true,
							contentEl:'applyTheBase'
						},
						{
							xtype:'panel',
							title: 'Definitions',
							bodyPadding: 5,
							layout:'fit',
							border:false,
							autoScroll:true,
							contentEl:'definitions'
						}
			        ]
			    }, {
			        region: 'south',
			        contentEl: 'log',
			        height: 30,
			        minHeight: 30,
			        margins: '5 5 5 5'
			    }, {
			        region: 'east',
			        width: 300,
			        margins: '0 5 0 5',
			        items:[
				        Ext.create('Ext.tab.Panel', {
					    	region: 'center',
					    	border:false,
					        items: [
								{
									title: 'About',
									border: false,
									iconCls:'information',
									bodyPadding: 5,
									contentEl: 'about'
								},
//				                {
//				                	title: 'Properties',
//				                	disabled: true,
//				                	border: false,
//				                	iconCls:'application_view_list',
//			                		tabConfig: {
//						                tooltip: 'The properties of the selected element.'
//						            }
//						        }, 
//						        {
//						            title: 'Chat',
//						            iconCls:'comments',
//						            disabled: true,
//						            border:false,
//						            tabConfig: {
//						                tooltip: 'A chat for testing the knowledge base.'
//						            },
//						            items:[
//						                   {
//						                	    //height: 500,
//						                	    width: 500,
//						                	    border: false,
//						                	    layout: 'fit',
//						                	    autoScroll: false,
//						                	    html: "<iframe src='http://thechatdomain.com' height=100% width=100% border='0'></iframe>",
//						                	    autoShow: true
//						                	}
//						            ]
//						        },
//						        {
//						            title: 'Utilities',
//						            iconCls:'wrench',
//						            disabled: true,
//						            border:false,
//						        }
						        
					        ]
					    })
				    ]
			    },
			    Ext.create('Ext.tab.Panel', {
			    	region: 'center',
			        items: [
		                {
		                	title: 'Knowledge Base',
		                	iconCls:'book',
		                	contentEl: 'theTree'
				        }, 
//				        {
//				            title: 'Bots',
//				            disabled: true,
//				            iconCls:'status_offline',
//				            tabConfig: {
//				                tooltip: 'AIML Bots configurations set'
//				            }
//				        }
			        ],
			        tbar: [
							{
								text: 'Apply',
								tooltip:'Apply the new Knowledge Base to the bot.',
								iconCls:'accept',
								  handler:function(){
									  this.setDisabled(true)
									  Log.info("Applying the new Knowledge Base. Please wait...")
									  Ext.Ajax.request({
										   url: 'rest/knowledges/apply.json',
										   success: function(response, opts) {
											   var obj = Ext.decode(response.responseText);
											   if(obj.success=="true"){
												   Log.info("Knowledge Base applied succesfully. New files in: " + obj.path+".")
											   }
											   else
											   {
												   Log.error("Unable to apply the new Knowledge base. " + obj.msg)
											   }
										   },
										   failure: function(response, opts) {// network error
											   var obj = Ext.decode(response.responseText);
											   Log.error("Unable to apply the new Knowledge base. " + obj.msg)
										   }
										})
										this.setDisabled(false)
								  }
							},
							'->',
//					        {
//								//disabled: true,
//					            xtype    : 'textfield',
//					            name     : 'field1',
//					            emptyText: 'type to search...'
//					        },
						]
			    })
            ]
        });
    }
});


function KnowledgeExtWrapper(){
	
	var store = null;
	defineProxy();
	defineModel();
	defineStore();
	
	this.create = function(){
		var record = Ext.create('Brain.model.Knowledge', {name:'', parentId:ObjectManager.getLastClicked().id})
		var form = prepareForm(record, {
			success: function(rec, op){
				store.add(rec.data);
				st.add({id:rec.data.id, name:rec.data.name, data:{}, children:[]});
			},
			failure: function(rec, op) { Log.error(op.getError()); }
		});
		var panel = basicWindow('Create a Knowledge', [ form ])
		panel.show();
		return panel;
	}
	
	this.update  = function(){
		var record = store.findRecord('id',ObjectManager.lastClicked.id, 0, false, true, true)
		var form = prepareForm(record, {
			success: function(rec, op) {
				record.commit();
				st.rename(ObjectManager.lastClicked, rec.data.name); 
			},
			failure: function(rec, op) { Log.error(op.getError()); }
		});
		var panel = basicWindow('Update the Knowledge', [ form ])
		panel.show();
		return panel;
	}
	
	this.destroy = function(){
		if(ObjectManager.lastClicked.getParents().length == 0){
			Ext.MessageBox.alert("","Unable to delete the tree's root knowledge")
		}
		else{
			Ext.MessageBox.confirm('Confirm to delete the knowledge?', 'If yes, all its topicss and nested knowledges will be removed too. Are you sure?', function(answer){
				if(answer == 'yes'){
					var record = store.findRecord('id',ObjectManager.lastClicked.id, 0, false, true, true)
					store.remove(record)
					store.sync();
				}
			});
		};
	}
	
	function prepareForm(record, callbacks){
		function saveAndNew(){
			save();
			knowledgeExtWrapper.create();
		}
		
		function save(){
			theForm.getForm().getRecord().save({
				success: function(rec, op) { 
					theForm.up().close(); 
					if (callbacks != null) callbacks.success(rec, op); 
				},
				failure: function(rec, op) { if (callbacks != null) callbacks.failure(rec, op); }
			});
		}
		
		var theForm = Ext.create('Ext.form.Panel', {
			border:false, layout:'form', bodyPadding: 5,
			model: 'Brain.model.Knowledge',
			items:[
			       {
			    	   xtype: 'textfield', fieldLabel: 'Name', name: 'name',
			    	   allowBlank: false, minLength: 2, maxLength: 40, validator:validateEmptyString,
			    	   listeners:{
			    		   'blur' : function( e, eOpts ){
			    			   theForm.getForm().getRecord().set(this.name, this.value)
			    		   }
			    	   }
			       }
		       ],
		       bbar: [
		              {
		            	  xtype: 'button', text: 'Save',
		            	  iconCls:'accept',
		            	  formBind : true,
		            	  handler: save,
		            	  scope: this
		              }, '-',
//		              {
//					   xtype: 'button', text: 'Save and new', 
//					   formBind : true,
//					   handler: saveAndNew,
//					   scope: this
//					}, '-',
					{
					   xtype: 'button', text: 'Cancel',
					   iconCls:'cancel',
					   handler: function() { theForm.up().close(); },
					   scope: this
					}
				]
		});
		theForm.getForm().loadRecord(record);
		return theForm;
	}
	
	function basicWindow(title, items){
		return Ext.create('Ext.window.Window', {
			title:       title,
			modal:       true,
			closable:    true,
			resizable:	 false,
			height:      200,
			width:       400,
			layout:      'fit',
			items:       items,
			listeners:{
				'show':function(window){
					window.items.first().getForm().getFields().first().focus();
				}
			}
		});
	}
	
	function defineProxy(){
		this.proxy = {
	        type:     'rest',
	        url :     'rest/knowledges',
	        model:    'Brain.model.Knowledge',
	        format:   'json',
	        appendId: true
	    };
	}
	
	function defineModel(){
		Ext.define('Brain.model.Knowledge', {
		    extend: 'Ext.data.Model',
		    fields:['id', 'name', 'parentId'],
		    proxy: this.proxy
		});
	}
	
	this.getStore = function(){return store;}
		
	function defineStore(){
		store = Ext.create('Ext.data.Store', {
		     model: 'Brain.model.Knowledge',
		     autoLoad: true,
		     autoSync: false,
		     listeners:{
		    	 'remove':function(store, record, index, isMove, eOpts){
		    		 st.remove(ObjectManager.lastClicked)
		    		 ObjectManager.setLastClicked(null)
		    	 }
		     }
		 });
	}
}

var knowledgeExtWrapper = new KnowledgeExtWrapper();



function TopicExtWrapper(){
	var store = null;
	defineModel();
	initStore();
	this.grid = initGrid(); //temp implementation
	this.teachingExtWrapper = new TeachingExtWrapper();
	var me = this
	
	function create(){
		var record = Ext.create('Brain.model.Topic', {name:'', knowledgeId:ObjectManager.getLastClicked().id})
		var form = prepareForm(record, {
			success: function(rec, op){
				store.add(rec.data)
				Log.info("Topic named '" + rec.data.name + "' created successfully.");
			},
			failure: function(rec, op) { Log.error(op.getError()); }
		});
		var p = basicWindow('Create a Topic', [ form ]);
		p.show();
		return p;
	}
	
	function update(){
		
		if(me.grid.getSelectionModel().getLastSelected() == null) return false;
		
		var selectedItem = me.grid.getSelectionModel().getLastSelected().data
		var record = store.findRecord('id', selectedItem.id, 0, false, true, true)
		var form = prepareForm(record, {
			success: function(rec, op) {
				record.commit();
				Log.info("Topic renamed to '" + rec.data.name + "' successfully."); 
			},
			failure: function(rec, op) { Log.error(op.getError()); }
		});
		var panel = basicWindow('Update the Topic', [ form ])
		panel.show();
		return panel;
	}
	
	function destroy(){
		var selectedItem = me.grid.getView().getSelectionModel().getSelection()[0];
		if(selectedItem == null) return false;
		Ext.MessageBox.confirm('Confirm to delete the Topic?', 'If yes, all its teachings will be removed too. Are you sure?', function(answer){
			if(answer == 'yes'){
				store.remove(selectedItem);
				store.sync();
			}
		});
	}
	
	function prepareForm(record, callbacks){
		var theForm = Ext.create('Ext.form.Panel', {
			border:false, layout:'form', bodyPadding: 5,
			model: 'Brain.model.Topic',
			items:[
			       {
			    	   xtype: 'textfield', fieldLabel: 'Name', name: 'name',
			    	   allowBlank: false, minLength: 2, maxLength: 40, validator:validateEmptyString,
			    	   listeners:{
			    		   'blur' : function( e, eOpts ){
			    			   theForm.getForm().getRecord().set(this.name, this.value)
			    		   }
			    	   }
			       }
		       ],
		       bbar: [
		              {
					   xtype: 'button', text: 'Save',
					   iconCls:'accept',
					   formBind : true,
					   handler: function(){theForm.getForm().getRecord().save({
						    success: function(rec, op) { 
						    	theForm.up().close(); 
						    	if (callbacks != null) callbacks.success(rec, op); 
						    },
						    failure: function(rec, op) { if (callbacks != null) callbacks.failure(rec, op); }
						});},
					   scope: this
					}, '-',
					{
					   xtype: 'button', text: 'Cancel',
					   iconCls:'cancel',
					   handler: function() { theForm.up().close(); },
					   scope: this
					}
				]
		});
		theForm.getForm().loadRecord(record);
		return theForm;
	}
	
	function initGrid(){
		return Ext.create('Ext.grid.Panel', {
		   region: 'north',
		   margins: '5 5 5 5',
		   height: 205,
		   title: 'Topics of ' + ObjectManager.getLastClicked().name,
		   store: store,
		   tbar: [
				{
					  text: 'Create',
					  iconCls:'application_add',
					  handler:function(){ create(); }
				}, '-',
				{
					  text: 'Update',
					  iconCls:'application_edit',
					  handler:function(){ update(); }
				}, '-',
				{
					  text: 'Delete',
					  iconCls:'application_delete',
					  handler:function(){ destroy(); }
				}
			],
		    columns: [{ text: 'Name',  dataIndex: 'name', width:'100%'}],
		    listeners:{
		    	select:function( theGrid, record, index, eOpts ){
		    		me.teachingExtWrapper.setTopic(record.data)
		    	},
				deselect:function( record, index, eOpts ){
					me.teachingExtWrapper.setTopic(null)
				},
				itemdblclick: function( record, item, index, e, eOpts ){
					update();
				}
		    }
		});
	}
	
	function basicWindow(title, items){
		return Ext.create('Ext.window.Window', {
			title:       title,
			modal:       true,
			closable:    true,
			resizable:	 false,
			height:      200,
			width:       400,
			layout:      'fit',
			items:       items,
			listeners:{
				'show':function(window){
					window.items.first().getForm().getFields().first().focus();
				}
			}
		});
	}
	
	function defineModel(){
		Ext.define( 'Brain.model.Topic', {
		    extend: 'Ext.data.Model',
		    fields:['id', 'name', 'knowledgeId'],
		    proxy: {
				type: 'rest',
				url : 'rest/knowledges/'+ObjectManager.lastClicked.id+'/topics',
				appendId: true
		    }
		});
	}
		
	function initStore(){
		store = Ext.create('Ext.data.Store', {
			model: 'Brain.model.Topic',
			autoLoad: true,
			autoSync: false,
			listeners:{
				'remove':function(store, record, index, isMove, eOpts){
					me.teachingExtWrapper.setTopic(null)
					Log.info("Topic '"+record.data.name+"' deleted successfully.");
				}
			}
		 });
	}
}


/**
 * 
 * @returns
 */
function TeachingExtWrapper(){

	var topic = null;
	initProxy('rest/knowledges/'+ObjectManager.lastClicked.id+'/topics/noId/teachings');
	defineModel();
	var store = initStore();
	var grid = this.grid = initGrid();
	
	
	this.setTopic = function(newTopic){
		topic = newTopic;
		
		if(newTopic == null){
			grid.setDisabled(true);
			this.grid.getSelectionModel().clearSelections();
			store.loadData([]);
		}
		else{
			grid.setDisabled(false);
			this.grid.getSelectionModel().clearSelections();
			this.grid.setTitle("Teachings of " + topic.name);
			changeProxyUrlTo('rest/knowledges/'+ObjectManager.lastClicked.id+'/topics/'+topic.id+'/teachings')
			store.reload();
		}
	}
	
	function changeProxyUrlTo(url){
		initProxy(url);
		defineModel();
		store.proxy.url = url;
	}
	
	function create(){
		var record = Ext.create('Brain.model.Teaching', {topicId:topic.id, whenTheUserSays:'', respondingTo:'', memorize:'', say:''})
		var form = prepareForm(record, {
			success: function(rec, op){
				store.add(rec.data)
				record.commit();
				Log.info("Teaching created successfully.");
			},
			failure: function(rec, op) { Log.error(op.getError()); }
		});
		var p = basicWindow('Create a Teaching', [ form ])
		p.show();
		return p;
	}
	
	function update(){
		if(grid.getSelectionModel().getLastSelected() == null) return false;
		var selectedItem = grid.getSelectionModel().getLastSelected().data
		var record = store.findRecord('id', selectedItem.id, 0, false, true, true)
		var form = prepareForm(record, {
			success: function(rec, op) {
				record.commit();
				Log.info("Teaching updated successfully."); 
			},
			failure: function(rec, op) { Log.error(op.getError()); }
		});
		var panel = basicWindow('Update the Teaching', [ form ])
		panel.show();
		return panel;
	}
	
	function destroy(){
		var selectedItem = grid.getView().getSelectionModel().getSelection()[0];
		if(selectedItem == null) return false;
		Ext.MessageBox.confirm('Confirm to delete the theaching?', 'Are you sure?', function(answer){
			if(answer == 'yes'){
				store.remove(selectedItem);
				store.sync();
			}
		});
	}
	
	function initGrid(){
		return Ext.create('Ext.grid.Panel', {
			disabled:true, 
			region: 'center',
			layout: 'fit',
			margins: '0 5 5 5',
			title: 'Teachings',
			store: store,
			tbar: [
		          {
		        	  text: 'Create',
		        	  iconCls:'application_add',
					  handler:function(){ create(); }
		          }, '-',
		          {
		        	  text: 'Update',
		        	  iconCls:'application_edit',
					  handler:function(){ update(); }
		          }, '-',
		          {
		        	  text: 'Delete',
		        	  iconCls:'application_delete',
					  handler:function(){ destroy(); }
		          }
		          ],
		   columns: [
                    { text: 'When the user says',  dataIndex: 'whenTheUserSays', width:280},
                    { text: 'Responding to',  dataIndex: 'respondingTo', width:200 },
                    { text: 'Memorize',  dataIndex: 'memorize', width:100},
                    { text: 'Say',  dataIndex: 'say', width:280 },
           ],
           listeners:{
        	   itemdblclick:function( record, index, eOpts ){
        		   update();
        	   }
           },
           height: 200
	   });
	}
	
	function prepareForm(record, callbacks){
		var theForm = Ext.create('Ext.form.Panel', {
			border:false, layout:'form', bodyPadding: 5,
			model: 'Brain.model.Teaching',
			items:[
			       {
			    	   xtype: 'textareafield', fieldLabel: 'When the user says', name: 'whenTheUserSays',
			    	   emptyText:'Likely user\'s sentences (one per line)',
			    	   allowBlank: false, minLength: 1, maxLength: 200, height:85, validator:validateEmptyString
			       },
			       {
			    	   xtype: 'textfield', fieldLabel: 'Responding to', name: 'respondingTo',
			    	   emptyText:'Some bot phrase',
			    	   allowBlank: true, minLength: 1, maxLength: 40
			       },
			       {
			    	   xtype: 'textareafield', fieldLabel: 'Memorize', name: 'memorize',
			    	   emptyText:'Some key=value pair like: name=\'Israel\' (one per line)',
			    	   disabled:true, allowBlank: true, minLength: 3, maxLength: 200, height:85, validator:validateEmptyString,
			       },
			       {
			    	   xtype: 'textareafield', fieldLabel: 'Then say', name: 'say',
			    	   emptyText:'The bot\'s responses to the user input. Can access memorized variables. Example: Hello, ${name}. (one per line)',
			    	   allowBlank: false, minLength: 1, maxLength: 200, height:85, validator:validateEmptyString,
			       }
		       ],
		       bbar: [
		              {
					   xtype: 'button', text: 'Save',
					   iconCls:'accept',
					   formBind : true,
					   handler: function(){
						   var record = theForm.getForm().getRecord()
						   theForm.getForm().getFields().each( copyValueToRecord );
						   function copyValueToRecord(field){ record.set(field.name, field.value) }
						   
						   theForm.getForm().getRecord().save({
							   success: function(rec, op) { 
								   theForm.up().close(); 
								   if (callbacks != null) callbacks.success(rec, op); 
							   },
							   failure: function(rec, op) { if (callbacks != null) callbacks.failure(rec, op); }
						   });
					   },
					   scope: this
					}, '-',
					{
					   xtype: 'button', text: 'Cancel',
					   iconCls:'cancel',
					   handler: function() { theForm.up().close(); },
					   scope: this
					}
				]
		});
		theForm.getForm().loadRecord(record);
		return theForm;
	}
	
	function basicWindow(title, items){
		return Ext.create('Ext.window.Window', {
			title:       title,
			modal:       true,
			closable:    true,
			resizable:	 false,
			height:      365,
			width:       700,
			layout:      'fit',
			items:       items,
			listeners:{
				'show':function(window){
					window.items.first().getForm().getFields().first().focus();
				}
			}
		});
	}
	
	function initProxy(url){
		this.proxy = {
	        type:     'rest',
	        url :     url,
	        model:    'Brain.model.Teaching',
	        format:   'json',
	        appendId: true
	    };
	}
	
	function defineModel(){
		Ext.define('Brain.model.Teaching', {
		    extend: 'Ext.data.Model',
		    fields:['id', 'topicId', 'whenTheUserSays', 'respondingTo', 'memorize', 'say'],
		    proxy: this.proxy
		});
	}
		
	function initStore(){
		return Ext.create('Ext.data.Store', {
		     model: 'Brain.model.Teaching',
		     proxy: this.proxy,
		     autoLoad: false,
		     autoSync: false,
			listeners:{
				'remove':function(store, record, index, isMove, eOpts){
					Log.info("Teaching deleted successfully.")
				}
			}
		 });
	}
}

function TopicAndTeachingWindow() {
	var topicExtWrapper = new TopicExtWrapper();
	Ext.create('Ext.window.Window', {
		title:       'Topics & Teachings of ' + ObjectManager.getLastClicked().name,
		modal:       true,
		closable:    true,
		resizable:	 false,
		height:      600,
		width:       900,
		layout:      'border',
		items:[	topicExtWrapper.grid, topicExtWrapper.teachingExtWrapper.grid]
	}).show();
}

var contextMenu = Ext.create('Ext.menu.Menu', {
	items:[
	       { text: 'Add a Knowledge',       iconCls:'book_add', handler : function(item){knowledgeExtWrapper.create();} }, 
		   { text: 'Rename this Knowledge', iconCls:'book_edit', handler : function(item){knowledgeExtWrapper.update();} }, 
		   { text: 'Delete this Knowledge', iconCls:'book_delete', handler : function(item){knowledgeExtWrapper.destroy();} }, 
		   '-', 
		   { text: 'Copy to ...', disabled: true, iconCls:'page_copy', tooltip:'Copies the current state of knowledge and its topic to other knowledge. Changes in the original knowledge was not reflected in the copied knowledge.'},
		   { text: 'Move to ...', disabled: true, iconCls:'page_go', tooltip:'Moves this knowledge to other parent knowledge.'},
		   { text: 'Clone in ...', disabled: true, iconCls:'page_attach', tooltip:'Knowledge clones share the same topic. Changes in the original knowledge will be reflected in the copied knowledge.'},
		   { text: 'Is a ...', disabled: true, iconCls:'page_link', tooltip:'Creates an inheritance relationship among knowledges. Makes this knowledge possess all the topic on other knowledge. Changes in the original knowledge will be reflected in the copied knowledge.'},
		   '-', 
		   { text: 'Topics & Teachings', iconCls:'book_open', handler : function(item){new TopicAndTeachingWindow()}, tooltip: ''}
   ]
});

function validateEmptyString(str){    
	if(str && str.trim() != "") return true;    
	return "This field can not be empty"
}

