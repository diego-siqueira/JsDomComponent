export default {
	// updating status reference
	updating: false

	,list: {}
	
	/*
	 * Checklist for element event attributes search
	 * used to check if element has already been checked by element ID
	 */
	,eventsCheckList: []

	/*
	 * List with child ids number for setting unique id.
	 * when setting id, if element ID is already in controller,
	 * it will add in this list the ID repeated and add the count to the
	 * end of id, so creating a unique id for repeated childs without ID set.
	 * {id: count}
	 */

	 ,idControl: {}

	/*
	 * Clean list of controllers to execute
	 */
	,clean: function(){ this.list = {}; this.idControl = {}; this.eventsCheckList = []; this.updating = false}
	

	/*
	 * Add controller to list of controllers
	 */
	,add: function(controller, id){
		if(controller){
			// get list if already exists || create new empty list
			this.list[id] = (this.list[id]) ? this.list[id] : [];
			// add function to list of execution
			this.list[id].push(controller);
		};
	}


	/*
	 * Execute all controller's methods after insertion
	 * send JQuery element wrapper as parameter
	 */
	,execute: function(){
		const startN =Object.keys(this.list).length;
		// get the keys (id) of each controllers list
		Object.keys(this.list).forEach((id, i)=>{
			//console.log(this.controllers.list, id);
			// get list of functions to execute by 1 id
			const moduleController = this.list[id];
			// if list has functions execute each one and pass the DOM element as parameter
			if(moduleController && moduleController.length > 0){
				moduleController.forEach((controller, i2)=>{
					const isLast = (moduleController.length == i2 + 1);
					const idWrapper = ($.escapeSelector) ? "#"+$.escapeSelector(id) : "#"+id;
					var wrapper = $(idWrapper);
					(typeof controller === "function") && controller(wrapper);
					// if all function are executed
					if(isLast){
						// delete element from list
						delete this.list[id];
						// if is end of list update status and clean
						(startN == i + 1) && this.clean();
					}
				});
			}else{
				// if is end of list update status and clean
				(startN == i + 1) && this.clean();
			}
		});

		// set tips
		this.setTips();
	}
	
	,setTips: function(){
		$("[data-tip]").bind("mouseenter", function(e){
			const tip = $(this);
			const className = tip.attr("data-tipclass");
			const styles = tip.attr("data-tipstyles");
			const position = tip.attr("data-tipposition");

			$(this).on('mousemove', function(e){
				var top = (position && position == "top") ? e.pageY  - 25 : e.pageY  + 15;
				var left = e.pageX;
				if(left + $("#tip").width() > $("section.exapta").width()){
					$("#tip").offset({top: top, left: left - $("#tip").width()});
				}else{
					$("#tip").offset({top: top, left: left});
				}
				
			}); 

			(styles) && styles.split(";").forEach((style)=>{ 
				style = style.split(":");
				$("#tip").css(style[0], style[1]);
			});

			(className) && $("#tip").addClass(className);
			$("#tip").addClass('active');
			$("#tip").text($(this).attr("data-tip"));
		});
		$("[data-tip]").bind("mouseleave", function(e){
			$(this).off('mousemove');
			$("#tip").removeClass();
			$("#tip").removeAttr("style");
			$("#tip").offset({top: 3000, left: -100});
		});
	}
}
