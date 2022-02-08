export default  {

	elements: {}

	,check: (newer, older)=>{
		//this.checkAndUpdate(this.newEl, this.oldEl);
		this.checkContent(newer, older);
	}
	
	,checkAttributes: function(newer, older){
		const newAttributes = newer.prop("attributes");
		const oldAttributes = older.prop("attributes");
		const ID = "#" + newer.attr("id");

		//console.log("checking attribute", newAttributes, oldAttributes);

		$.each(newAttributes, function() {
			if(this.name == "id"){return false};
			const hasAttr = older.attr(this.name);

			//const isEvent = (this.name.substring(0, 2) == "on");
			//(isEvent) && newer.removeAttr(this.name);
			
			// if element don't have new attribute
			// OR
			// if element has attr but it differs
			if((!hasAttr) || (hasAttr && this.value != hasAttr)){
				//console.log("updating attribute", ID, this.name, " : ", hasAttr, "->", this.value);
				$(ID).attr(this.name, this.value);
			}
		});

		$.each(oldAttributes, function() {
			const hasAttr = newer.attr(this.name);
			// if new element don't have old attribute, remove it
			(!hasAttr) && $(ID).removeAttr(this.name);
			//(!hasAttr) && console.log("removing attr", this.name);
		});
		//console.log("\n");
	}

	,checkAndUpdate: function(newElement, oldElement){
		var ID = "#" + $(oldElement).attr('id');

		// console.log("\n ----------------------------------------------------");
		// console.log("Updating", ID);
		// console.log("old", oldElement);
		// console.log("new", newElement);

		this.checkContent(newElement, oldElement);
	}

	,checkContent: function(newElement, oldElement){
		// get children of elements
		const newContents = newElement.contents();
		const oldContents = oldElement.contents();
		const elementID = newElement.attr("id");

		// check and update attributes
		//console.log("check attr of element", elementID);
		this.checkAttributes(newElement, oldElement);


		oldContents.each((i, content)=>{
			// if it's a node text
			if(content.nodeType == 3){
				// compare new text with new element [index] text
				if(content.nodeValue != newContents[i].nodeValue){
					// remove text if they are different
					//console.log("removing text", content.nodeValue);
					content.remove();
				}
				return false;
			}
			// get element ID
			const ID = "#" + $(content).attr("id");
			// get updatable content reference
			const newer = newElement.find(ID);

			//(newer.length == 0) && console.log("deleting", ID);
			// if element don't exist in new version, remove it
			(newer.length == 0) && $(ID).remove();
		});

		newContents.each((i, content)=>{
			// if it's a node text
			if(content.nodeType == 3){
				// compare new text with old element [index] text
				if(content.nodeValue != oldContents[i].nodeValue){
					// replace text if they are different
					//console.log("replacing text", oldContents[i].nodeValue, "->", content.nodeValue);
					oldContents[i].nodeValue = content.nodeValue
				}
			}

			if(content.nodeType == 1){
				// get element ID
				const ID = "#" + $(content).attr("id");
				// get updatable content reference
				const oldContent = $(ID);

				// if element already exist in DOM
				if(oldContent.length == 1){
					// check if content has children
					const hasChildren = ($(content).children().length > 0);
					// if children check children and check children
					if(hasChildren){
						this.checkContent($(content), oldContent)
					}else{
						//check text changes
						const newText = $(content).text();
						const oldText = oldContent.text();
						//console.log(ID, newText, oldText);
						(newText != oldText) && this.updatable.find(ID).text(newText);
						this.checkAttributes($(content), oldContent);

					};

					//(hasChildren) ? console.log("child has childen", ID) : console.log("check attr of child", ID);
				}

				// if element doesn't exist, insert it in position
				if(oldContent.length == 0){
					//console.log("child don't exist yet", "insert in position", i, content);
					(i == 0) ? oldElement.prepend(content) : oldElement.children().eq(i - 1).after(content);
				}

				(oldContent.length > 1) && console.log("duplicate ID", ID)
			}
		});
	}
}
