import controllers from "./controllers.js";
import updater from "./update.js";
import services from "../services/services.js";

export default class Interface {
	constructor(props){
		this.props = props;
		this.controllers = controllers;
		this.updater = updater;
		this.ID;
		this.UID = this.setTempID();
		this.html = false;
	}

	services(){
		return services;
	}

	/**
	* Method executed after inserting DOM element 
	*
	* controller(){
	* 	do stuff...
	* }
	*
	*/

	/*
	 * HTML template
	 */
	render(){
		return ""
	}


	/***** INSERT METHODS *****/

	/*
	*	Build and insert a PARENT module (starting point).
	*	All children modules will be built with:
	*
	* ex: 
	*
	* class ParentModule extends Interface{
	*	constructor(props){
	*		super(props);
	*		this.props = props;
	*	}
	*
	*	...
	*
	*	render(){
	*		return `<div onClick="this.action">
	*					new ChildModule(this.props).set()
	*				</div>`;
	*	}
	* }
	*
	* new ParentModule(PROPS).appendTo('div#ID');
	*
	*/

	prependTo(element){
		//console.log("prepending");
		$(element).prepend(this.build());
		//console.log(this.controllers);
		(Object.keys(this.controllers.list).length > 0) && this.controllers.execute();
	}

	appendTo(holder){
		//console.log("appending");
		const element = this.build();
		$(holder).append(element);
		//console.log(this.controllers);
		(Object.keys(this.controllers.list).length > 0) && this.controllers.execute();

		//console.log(this.updater.elements);
		return $(element);
		
	}

	/*
	 * Pop-up methods
	 *
	 * Insert modeule as pop-up to "section.content"
	 * @ param Bollean noClass = avoids to add default class to popup
	 */
	popup(noClass){
		var element = $(this.render());
		var id = element.attr("id");
		($("#"+id).length > 0) && $("#"+id).remove();
		this.appendTo("section.content");
		(!noClass) && $("#"+id).addClass("interface-popup");
	}

	/*
	 * Remove all pop-ups that have the default class
	 */
	popclear(){
		$(".interface-popup").fadeOut(150, function(e){$(this).remove});
	}



	/*
	 * return JQuery DOM element after configurations of element
	 */
	build(){
		var element = $(this.set());
		return element;
	}

	/*
	 * Method to be executed when adding module dependeces (module hierarchy).
	 * - set element configuration
	 * - add method controller to controllers list
	 * - add method click to controllers list
	 * - returns HTML
	 */
	set(){
		var element = this.setElement()
		this.html = element.wrapper;
		(this.controller) && this.controllers.add(this.controller.bind(this), element.id);
		(this.click) && this.controllers.add(this.clickAction.bind(this), element.id);
		(this.clickOutside) && this.controllers.add(this.watchOutsideClick.bind(this, element.id), element.id);
		return this.html;
	}

	/*
	 * Set element configuration:
	 * - check and set ID for element and childrens as needed;
	 * - check and set events for element and children
	 * - returns HTML of element and ID of element
	 */
	setElement(){
		// get html and build a DOM node
		var html = this.render();
		const regex = /\s\s+/g;
		html = html.replace(regex, "");
		var el = $(html);


		// get and set element id
		var id = (el.attr("id")) ? el.attr("id") : this.setTempID();
		(!el.attr("id")) && el.attr("id", id);

		//this.updater.elements[this.UID] = this.props;

		// set events for this element wrapper
		this.setEvents(el);

		// if element has children, set id and events for children
		(el.children().length > 0) && this.setChildren(el);

		// set event for elements if any
		//this.setAllEvents(el);

		// set id to public access *** fix for loading error (not good)
		this.ID = ($.escapeSelector) ? "#" + $.escapeSelector(id) :  "#" + id;


		// wrap it to get html of original content with id set
		var wrapper = $("<div></div>").append(el);
		return {wrapper: wrapper.html(), id: id};
	}

	/*
	* Creates a unique id for the element
	* based on the class name
	*/
	setTempID(){
		const className = this.constructor.name;
		//var idNumber = className.split("").map((letter)=>{return letter.charCodeAt()}).join("");
		this.controllers.idControl[className] = (this.controllers.idControl[className]) ? this.controllers.idControl[className] : 0;
		this.controllers.idControl[className] ++;
		return [className, this.controllers.idControl[className]].join("");
	}

	setChildren(el){
		// set id to element if needed
		var id = (el.attr("id")) ? el.attr("id") : this.setTempID();
		(!el.attr("id")) && el.attr("id", id);
		// get children of element
		const children = el.children();

		// check if el is not already checked for "attribute events"
		const shouldCheckEvent = (!this.controllers.eventsCheckList.includes(id));
		// add id to event checklist
		(shouldCheckEvent) && this.controllers.eventsCheckList.push(id);
		// set events for this element wrapper (case children of child)
		(shouldCheckEvent) && this.setEvents(el);

		// if element has childrens check each child
		(children.length > 0) && children.each((i, child)=>{
			// Set child id and add to checkl
			$(child).attr("id", this.setChildId(child));
			// if child has children
			if($(child).children().length > 0){
				// run this method for the child
				this.setChildren($(child));
			}else if(shouldCheckEvent){
				// or set events of child
				this.setEvents($(child));
			}
		});
	}

	/*
	* Set a unique ID for a child of element
	*/
	setChildId(child){
		// get class name of wrapper element
		const className = this.constructor.name;
		// get child id (if any)
		var id = $(child).attr("id");
		// get node name of child
		const childType = $(child).prop('nodeName');
		// set reference for child
		const childRef = (id) ? id : className + childType;
		// set checklist for control of childrens checked
		var childControl = this.controllers.idControl;
		// add reference to checklist
		childControl[childRef] = (childControl[childRef]) ? childControl[childRef] : 0;
		childControl[childRef] ++;
		// set id and return
		id = (id) ? id : childRef + childControl[childRef];
		return id;
	}

	/***** EVENTS ******/

	/*
	* Search all elements and their children for attributes "event callers".
	*  - attributes event callers start with "on" : "onClick", "onMouseover", etc.
	*  - attributes event callers have origin method names passed as String
	*    to be executed by event.
	* ex: 
	*
	* class Example extends Interface{
	*	constructor(props){
	*		super(props);
	*		this.props = props;
	*	}
	*	...
	*	action(){
	*		do stuff
	*		this.anotherMethod(this.propertie);
	*	}
	*	render(){
	*		return '<div onClick="this.action"></div>';
	*	}
	* }
	*
	*/
	setAllEvents(el){
		// get id of element
		const id = el.attr("id")
		// if element has already been checked, return
		if(this.controllers.eventsCheckList.includes(id)){return false};
		// add id to checklist
		this.controllers.eventsCheckList.push(id);
		// set events for this element wrapper
		this.setEvents(el);
		// get childrens of element
		const children = el.children();
		// if element has childrens check each child
		(children.length > 0) && children.each((i, child)=>{
			// if child has children
			if($(child).children().length > 0){
				// rerun event check to child
				this.setAllEvents($(child));
			}else{
				// or set events of child
				this.setEvents($(child));
			}
		});
	}

	/*
	* Check element attributes looking for event callers
	*/
	setEvents(el){
		// get element id
		const id = el.attr("id");
		// set scope to variable
		var me = this;
		var toRemove = []
		// check element
		el.each(function() {
			var all = this.attributes;
			// check attributs of element
			$.each(this.attributes, function(i) {
				// if any
			    if(this.specified) {
			    	// check if attribute is a caller for event (starts with "on")
			    	const isEvent = (this.name.substring(0, 2) == "on");
			    	// get event type (onClick => eventType = click);
			    	var eventType = this.name.substring(2);
			    	eventType = eventType.toLowerCase();
			    	// add eventAction method to controllers list
			    	//(isEvent) && console.log(id, "has event", eventType);
			    	(isEvent) && toRemove.push(this.name);
			    	//el.removeAttr(this.name);
			    	(isEvent) && me.controllers.add(me.eventAction.bind(me, id, eventType, this.value, this.name), id);
			    }

			    if(i+1 == all.length && toRemove.length > 0){
			    	toRemove.forEach(attr => el.removeAttr(attr));
			    }
			}); 
		});
	}

	/**
	 * Set event action of elements
	 * @param String id 	: id of element
	 * @param String type 	: type of event (JQuery events: click, mouseover, ...)
	 * @param String action : function "name" passed in the element
	 * @param String attr 	: attribute of element that calls event (onClick, onMouseover)
	 */
	eventAction(id, type, action, attr){
		// remove attribute reference to action
		//$("#"+id).removeAttr(attr);
		// unbind and bind event to element
		$("#"+id).off(type).on(type, (e)=>{
			// execute action with this scope binded
			(action && (typeof eval(action) == "function")) && eval(action).bind(this, $("#"+id), e)();
		});
	}



	/*
	 * Set click action of "click" method
	 */
	clickAction(){
		$(this.ID).off("click").on("click", (e)=>{
			this.click(this.ID, e);
		});
	}


	/**** UPDATE METHOD *****/

	/**
	 * Update DOM content of module
	 * @param: Bollean hard = reset element without checking children (for replacing all module);
	 */
	update(hard){
		if(this.controllers.updating){
			setTimeout(()=> this.update(hard), 100);
		}else{
			this.controllers.updating = true;
			this.controllers.idControl = {};
			// get element DOM node
			var element = this.build();
			// get children updated
			var content = element.children();
			// get id of element
			var id = (element.attr("id")) ? "#" + element.attr("id") : undefined;
			//console.log(this.ID);
			const classNames = element.attr("class");
			const classCollection = (classNames) ? "." + classNames.split(" ").join(".") : undefined;
			// if id exists get elem by id, else try to get by classes
			var IDelem = (id) ? id : (classCollection) ? classCollection : undefined;
			(!IDelem) && console.log("fail to update element: invalid id attribute", IDelem);

			//console.log(this.updater.elements);

			//if(hard){
				// clean old children and update with new ones
				$(IDelem).empty();
				$(IDelem).append(content);
			/*}else{
				// check for changes and update Dom
				//this.checkAndUpdate($(IDelem), $(element));
				updater.check($(element), $(IDelem));
			}*/

			// replace class changes
			(classNames != $(IDelem).attr("class")) && $(IDelem).removeClass().addClass(classNames);
			// execute controllers and click actions or finish updatin
			(Object.keys(this.controllers.list).length > 0) ? this.controllers.execute() : this.controllers.clean();
		}
	}

	watchOutsideClick(){
		// get clickOutside props
		const click = this.clickOutside($(this.ID));
		// get area to watch !@default = 'body'
		const area = (click.area) ? click.area : 'body';
		// watch fn
		const watch = (e)=>{
			// checks if click is inside element
			const inside = ($(e.target).closest(this.ID).length);
			// if not
			if(!inside){
				// condition:
				// IF Has an extention of element ("#idOfElementExtention") && click is NOT inside extention
				// OR Has no extention
				let condition = (click.extention) ? (!$(e.target).closest(click.extention).length) : true;
				// AND is NOT in save list
				const listOfAttr = [e.target.id].concat(e.target.className.split(" "));
				const safeList = (click.safeList) ? !listOfAttr.filter((attr)=>click.safeList.includes(attr)).length : true;
				if(condition && safeList){
					// do click outside action
					click.action()
					// remove watcher
					$(area).off('click', watch);
				}
			}else if(click.toggleCls && !$(this.ID).hasClass(click.toggleCls)){
                $(area).off('click', watch);
            }
		};

		const setDisabler = ()=> $(click.disabler).on("click", (e)=>{
			$(area).off('click', watch);
		});

		// if start prop, start watching clickoutside
		if(click.start){
		    $(area).off('click', watch).on('click', watch);
		    (click.disabler) && setDisabler();

		}else{ // else wait for element click to start watching clickoutside
		    $(this.ID).on("click", (e)=>{
		        $(area).off('click', watch).on('click', watch);
		        (click.disabler) && setDisabler();
		    });
		}
	}
	
}
