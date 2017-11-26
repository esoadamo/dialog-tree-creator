let div_dialog = document.querySelector('#dialogTree');
let txt_code = document.createElement('textarea');

/*
Mouse modes:
GENERAL - does nothing special
LINK - on click on some frame creates a link from selected option
*/
let mouse_mode = "GENERAL";
let mouse_data = null;  // global data related to the mouse_mode

// Mouse position variables
let mouse_x = 0;
let mouse_y = 0;

listItems = new Array();

class Item {
  /*
  The parent of the Frame and Option
  */

  constructor(root, title){
    /*
    Creates a item, sets its root
    */
    this.title = title;
    if (root == null)  // the root is root of itself
      root = this;
    this.root = root;
    this.level = root == this ? 0 : (root.level + 1);
    this.index = listItems.length;
    this.children = new Array();
    listItems.push(this);
    if (this != this.root)
      this.root.children.push(this);
  }

  button_remove(caller=true){
    /*
    Removes an Item from the dialog tree
    Removes all orphaned childs as well.
    :param caller: if not true, the item may not be removed, but moved under another root
    */
    if (this.root == this)  // Do not remove the root frame
      return;
    if (!caller) {  // Not forced to remove. Check if this item can be moved under another root
      for (let item of listItems)
        if (item.children.indexOf(this) !== -1) { // Ok, move this frame under another root
          this.root = item;
          return;
        }
    }
    this.root.children.splice(this.root.children.indexOf(this), 1);
    listItems.splice(listItems.indexOf(this), 1);
    for (let item of this.children)
      item.button_remove(false);
    if (caller)
      repaint();
  }

  click(){
    /*
    This event is called every time user clicks on some item.
    By default it does nothing, but you can override it.
    */
  }

  static getItemsSorted(){
    /*
    Creates a 2D array of all items, sorted into levels and the descendants are
    placed under their roots (mostly).
    Some elements of the array are null, which means blank space.
    :return: sorted 2D array with items and blank spaces (blank spaces are null)
    */

    const listItemsSorted = new Array();

    /*
    Sort items by levels, root (0) will be on top
    */
    for (let item of listItems){
      while (listItemsSorted.length <= item.level)  // adjust array size
       listItemsSorted.push(new Array());
      listItemsSorted[item.level].push(item);
    }

    /*
    Now sort items in each level so they will be each under its root item
    */
    let listRootsUpper = new Array();
    for (let itemsLevelArr of listItemsSorted){
      let dictRoots = new Array();

      for (let item of itemsLevelArr) {
        if (item.root == item) // the root is root of itself
          listRootsUpper.push(item.root.index);
        if (!(item.root.index in dictRoots))
          dictRoots[item.root.index] = new Array();
        dictRoots[item.root.index].push(item);
      }

      itemsLevelArr.length = 0;
      let listRootsCurrent = new Array();
      let itemsInLevelSorted = new Array();
      for (let root of listRootsUpper) {
        if (!(root in dictRoots))
          continue;
        for (let item of dictRoots[root]){
          listRootsCurrent.push(item.index);
          itemsLevelArr.push(item);
        }
        itemsLevelArr.push(null);  // separate every root block
      }
      itemsLevelArr.length = Math.max(itemsLevelArr.length - 1, 0);  // delete last null element
      listRootsUpper = listRootsCurrent;
    }

    return listItemsSorted;
  }
}


class Frame extends Item {
  /*
  Frame is an Item representing one monologue in the dialog.
  Frames can have unlimited child Options.
  */

  constructor (root, title, text){
    super(root, title);
    this.text = text;
  }

  getHTML() {
    /*
    Retuns HTML code representation of this object
    */
    let txt_title_id = 'title-' + this.index;
    let txt_text_id = 'text-' + this.index;
    let r = '<textarea id="'+ txt_title_id +'" onchange="listItems[' + this.index.toString() + '].title=document.getElementById(\'' + txt_title_id +'\').value;repaint();">' + this.title + '</textarea>' +
    '<textarea id="'+ txt_text_id +'" onchange="listItems[' + this.index.toString() + '].text=document.getElementById(\'' + txt_text_id +'\').value;repaint();">' + this.text + '</textarea>' +
    '<div class="buttons"><button onclick="listItems[' + this.index.toString() + '].button_add();"><i class="fa fa-plus" aria-hidden="true">Add option</i></button>';
    if (this.root != this)  // do not allow deleting of the root frame
      r +='<button onclick="listItems[' + this.index.toString() + '].button_remove();"><i class="fa fa-minus" aria-hidden="true">Delete</i></button>';
    r += "</div>"
    return r;
  }

  click(){
    /*
    Called when user clicks on this Frame
    If current mouse mode is LINK then a link will be created from the Option that
    is held inside the mouse_data variable
    */
    if (mouse_mode == "LINK") {
      mouse_mode = "GENERAL";
      let new_root = mouse_data;
      mouse_data = null;
      new_root.children.push(this.item);
      repaint();
    }
  }

  button_add() {
    /*
    This function is called when user presses the Link button on the Option
    Adds new child Option
    */
    new Option(this, 'New option');
    repaint();
  }
}

class Option extends Item{
  /*
  Option is and Item, which represents user choice in dialog.
  It can be linked to up to one Frame
  */

  getHTML() {
    /*
    Retuns HTML code representation of this object
    */
    let txt_title_id = 'title-' + this.index;
    let r = '<textarea id="'+ txt_title_id +'" onchange="listItems[' + this.index.toString() + '].title=document.getElementById(\'' + txt_title_id +'\').value;repaint();" style="text-align: center;">' + this.title + '</textarea>';

    // When option does not have any linked Frame, allow user to create new link
    if (this.children.length == 0) {
      r +=  '<div class="buttons"><button onclick="listItems[' + this.index.toString() + '].button_add();"><i class="fa fa-plus" aria-hidden="true">Add frame</i></button>';
      r +=  '<div class="buttons"><button onclick="listItems[' + this.index.toString() + '].button_link();"><i class="fa fa-plus" aria-hidden="true">Link</i></button>';
    }

    // Delete button
    r +='<button onclick="listItems[' + this.index.toString() + '].button_remove();"><i class="fa fa-minus" aria-hidden="true">Delete</i></button></div>';
    return r;
  }

  button_add() {
    /*
    This function is called when user presses the Link button on the Option
    Adds new child Frame
    */
    new Frame(this, 'New frame', '');
    repaint();
  }

  button_link(){
    /*
    This function is called when user presses the Link button on the Option
    Sets mouse mode to LINK, mouse data to this Option and starts drawing newly created line
    */
    mouse_mode = "LINK";
    mouse_data = this;
    function draw_link_creation(){
      /*
      Draws a line from this option to the mouse position.
      Auto-loops while mouse_mode == LINK
      */
      const line_id = "link_draw_to_mouse";
      const line = document.getElementById(line_id);
      if (line !== null)  // if link already exists, remove it so it can be repainted
        line.parentNode.removeChild(line);
      if (mouse_mode != "LINK")  // as this function is runned in loop, abort it when we have successfuly created the link
        return;
      let scroll_left = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
      let scroll_top = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
      let parent_offsets = document.getElementById('item-' + mouse_data.index.toString()).getBoundingClientRect();
      createLine(parent_offsets.left + (parent_offsets.width / 2) + scroll_left, parent_offsets.top + (parent_offsets.height * 0.9) + scroll_top, mouse_x, mouse_y).id = line_id;
      setTimeout(draw_link_creation, 100);
    }
    draw_link_creation();
  }
}

function createLine(x1,y1,x2,y2){
  /*
  Creates a DOM line from one point to another
  */
  const length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
  const angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const transform = 'rotate('+angle+'deg)';

  const line = document.createElement('div');
  line.className = 'line';
  line.style.top = y1 + 'px';
  line.style.left = x1 + 'px';
  line.style.width = length + 'px';
  line.style.transform = transform;

  div_dialog.appendChild(line);
  return line;
}

function getJSON(){
  /*
  Gets JSON representation of current dialog tree
  */
  let map = {};
  for (let item of listItems){
    if (item instanceof Option)
      continue;
    map[item.index] = {};
    map[item.index]['title'] = item.title;
    map[item.index]['text'] = item.text;
    map[item.index]['options'] = [];
    for (let option of item.children){
      option_data = {}
      option_data['title'] = option.title;
      if (option.children.length > 0)
        option_data['link'] = option.children[0].index;
      map[item.index]['options'].push(option_data);
    }
  }
  return JSON.stringify(map);
}

function parseJSON(json){
  /*
  Parses JSON back into the dialog tree
  */
  let map = JSON.parse(json);
  listItems.length = 0;

  function addFrame(frame_index, root){
    let frame_data = map[frame_index];
    let item = new Frame(root, frame_data['title'], frame_data['text']);
    for (let option_index in frame_data['options']){
      let option_data = frame_data['options'][option_index];
      let option = new Option(item, option_data['title']);
      if ('link' in option_data)
        addFrame(option_data['link'], option);
    }
  }
  addFrame(0, null);
  repaint();
}

function repaint(){
  /*
  Repaints the whole dialog section
  */
  div_dialog.innerHTML = "";  // Clear table for repainting

  const dictUnits = new Array();  // keys are indexes of items, values are their DOMs

  /*
  Paint the boxes
  */
  for (let itemsLevelArr of Item.getItemsSorted()){
    var row = document.createElement("div");
    row.className = "row";
    div_dialog.appendChild(row);

    for (let item of itemsLevelArr) {
      var unit = document.createElement("div");
      unit.className  = "unit";
      row.appendChild(unit);
      if (item != null) {
        unit.id = 'item-' + item.index;
        unit.item = item;
        unit.onclick = unit.addEventListener("click", item.click);
        unit.className += " filled";
        dictUnits[item.index] = unit;
        unit.innerHTML = item.getHTML();
      }
    }
  }

  /*
  Paint line between child and parent
  */
  let scroll_left = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
  let scroll_top = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
  for (let item of listItems){
    if (!(item.index in dictUnits))
     continue;
    let parent = dictUnits[item.index];
    let parent_offsets = parent.getBoundingClientRect();
    for (let child_item of item.children){
      if (!(child_item.index in dictUnits))
        continue;
      let child = dictUnits[child_item.index];
      let child_offsets = child.getBoundingClientRect();

      createLine(child_offsets.left + (child_offsets.width / 2) + scroll_left, (child_offsets.top * 1.1) + scroll_top, parent_offsets.left + (parent_offsets.width / 2) + scroll_left, parent_offsets.top + (parent_offsets.height * 0.9) + scroll_top);
    }
  }

  txt_code.value = getJSON();
}

function keypress(e){
  /*
  Handless keypresses
  */
  const key = e.keyCode ? e.keyCode : e.which;

  switch(key){
    case 27: // ESC
      // Reset mouse mode to GENERAL
      if (mouse_mode != "GENERAL") {
        mouse_mode = "GENERAL";
        mouse_data = null;
      }
      break;
  }
}

window.onload = function(){
   // Create root dialog
  new Frame(null, 'Dialog title', 'Dialog text');

  // Add live code production
  document.body.appendChild(document.createElement("br"));
  document.body.appendChild(txt_code);
  txt_code.style.width = "100%";
  txt_code.addEventListener('input',function(){parseJSON(txt_code.value);}, false);

  // Track mouse position and keypresses
  window.onkeyup = keypress;
  function mouse_move(e){
    mouse_x = e.pageX;
    mouse_y = e.pageY;
  }
  document.addEventListener('mousemove', mouse_move, false);
  document.addEventListener('mouseenter', mouse_move, false);

  // Make first paint
  repaint();
}
