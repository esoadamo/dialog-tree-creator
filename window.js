let div_dialog = document.querySelector('#dialogTree');
let txt_code = document.createElement('textarea');

listItems = new Array();

class Item {
  constructor(root, title){
    this.title = title;
    if (root == null)
      root = this;
    this.root = root; // the root is root of itself
    this.level = root == this ? 0 : (root.level + 1);
    this.index = listItems.length;
    this.children = new Array();
    listItems.push(this);
    if (this != this.root)
      this.root.children.push(this);
  }

  button_remove(repaint_now=true){
    if (this.root != this)
      this.root.children.splice(this.root.children.indexOf(this), 1);
    listItems.splice(this.index, 1);
    for (let item of this.children)
      item.button_remove(false);
    repaint();
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


    // console.log(JSON.stringify(listItemsSorted));
    return listItemsSorted;
  }
}


class Frame extends Item {
  constructor (root, title, text){
    super(root, title);
    this.text = text;
  }

  getHtml() {
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

  button_add() {
    new Option(this, 'New option');
    repaint();
  }
}

class Option extends Item{
  constructor(root, title) {
    super(root, title);
  }

  getHtml() {
    let txt_title_id = 'title-' + this.index;
    let r = '<textarea id="'+ txt_title_id +'" onchange="listItems[' + this.index.toString() + '].title=document.getElementById(\'' + txt_title_id +'\').value;repaint();" style="text-align: center;">' + this.title + '</textarea>';
    if (this.children.length == 0)
      r +=  '<div class="buttons"><button onclick="listItems[' + this.index.toString() + '].button_add();"><i class="fa fa-plus" aria-hidden="true">Add frame</i></button>';
    r +='<button onclick="listItems[' + this.index.toString() + '].button_remove();"><i class="fa fa-minus" aria-hidden="true">Delete</i></button></div>';
    return r;
  }

  button_add() {
    new Frame(this, 'New frame', '');
    repaint();
  }
}

function createLine(x1,y1,x2,y2){
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
}

function getJSON(){
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
        unit.className += " filled";
        dictUnits[item.index] = unit;
        unit.innerHTML = item.getHtml();
      }
    }
  }

  /*
  Paint line between child and parent
  */
  for (let item of listItems){
    if (!(item.index in dictUnits) || !(item.root.index in dictUnits) || (item == item.root))
     continue;
    let child = dictUnits[item.index];
    let child_offsets = child.getBoundingClientRect();
    let parent =  dictUnits[item.root.index];
    let parent_offsets = parent.getBoundingClientRect();

    let scroll_left = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
    let scroll_top = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
    scroll_top = 0;

    createLine(child_offsets.left + (child_offsets.width / 2) + scroll_left, (child_offsets.top * 1.1) + scroll_top, parent_offsets.left + (parent_offsets.width / 2) + scroll_left, parent_offsets.top + (parent_offsets.height * 0.9) + scroll_top);
  }

  txt_code.value = getJSON();
}

window.onload = function(){
  new Frame(null, 'Dialog title', 'Dialog text');  // Create root dialog
  document.body.appendChild(document.createElement("br"));
  document.body.appendChild(txt_code);
  txt_code.style.width = "100%";
  txt_code.addEventListener('input',function(){parseJSON(txt_code.value);}, false);
  repaint();
}
