//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const port = 3000||process.env.PORT;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

async function connectDB() {
  try {
    await mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
    console.log("todoListDB Connected");
  } catch (err) {
    console.log(err);
  }
}
connectDB();

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  async function insertItems(){
    try {
      const foundItems = await Item.find();
      if (foundItems.length === 0) {
        await Item.insertMany(defaultItems);
        console.log("Successfully savevd default items to DB.");
        res.redirect("/");
      }
      else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    } catch (err) {
      console.log(err);
    }
  }
  insertItems();
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(_.lowerCase(req.params.customListName));
  async function findList(){
    try {
      const foundList = await List.findOne({name: customListName});
      if (!foundList) {
        console.log("Doesn't exist");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        await list.save();
        res.redirect("/" + customListName);
      } else {
        console.log("Exists");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    } catch (err) {
      console.log(err);
    }
  }
  findList();

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    async function insertItem(){
      try {
        const list = await List.findOne({name: listName});
        list.items.push(item);
        await list.save();
        res.redirect("/" + listName);
      } catch (err) {
        console.log(err);
      }
      insertItem();
    }
  }
});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    async function deleteItem(){
      try {
        const deletedItem = await Item.findByIdAndRemove(checkedItemId);
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      } catch (err) {
        console.log(err);
      }
    }
    deleteItem();
  } else {
    async function deleteItem(){
      try {
        const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        res.redirect("/" + listName);
      } catch (err) {
        console.log(err);
      }
    }
    deleteItem();
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(port, function() {
  console.log(`Server started on port ${port} successfully`);
});
