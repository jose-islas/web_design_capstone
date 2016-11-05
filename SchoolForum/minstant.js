Chats = new Mongo.Collection("chats");


if (Meteor.isClient) {
	emoti = 0;
	Meteor.subscribe("chats");
	Meteor.subscribe("users");
	Meteor.subscribe('emojis');


  // set up the main template the the router will use to build pages
  Router.configure({
    layoutTemplate: 'ApplicationLayout'
  });
  // specify the top level route, the page users see when they arrive at the site
  Router.route('/', function () {
    console.log("rendering root /");
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});  
	//Router.route('/drawingApp', function() {
    this.render("wall_1", {to:"home_drawing"});
	//})
  });

  // specify a route that allows the current user to chat to another users
  Router.route('/chat/:_id', function () {
    // the user they want to chat to has id equal to 
    // the id sent in after /chat/... 
    var otherUserId = this.params._id;
    // find a chat that has two users that match current user id
    // and the requested user id
    var filter = {$or:[
                {user1Id:Meteor.userId(), user2Id:otherUserId}, 
                {user2Id:Meteor.userId(), user1Id:otherUserId}
                ]};
    var chat = Chats.findOne(filter);
    if (!chat){// no chat matching the filter - need to insert a new one
      ////chatId = Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
	  chatId = Meteor.call("addChats", otherUserId);
    }
    else {// there is a chat going already - use that. 
      chatId = chat._id;
    }
    if (chatId){// looking good, save the id to the session
      Session.set("chatId",chatId);
    }
    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});  
	this.render("wall_1", {to:"home_drawing"});
  });

Router.route('/drawingApp', function() {    
    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});  
    this.render("wall_1", {to:"home_drawing"});
});  
  
  ///
  // helper functions 
  /// 
  Template.available_user_list.helpers({
    users:function(){
      return Meteor.users.find();
    }
  })
 Template.available_user.helpers({
    getUsername:function(userId){
      user = Meteor.users.findOne({_id:userId});
      return user.profile.username;
    }, 
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    }
  })
// added by me
 Template.chat_message.helpers({
    getAvatar:function(id){
	  user1 = Meteor.users.findOne({_id:id});
	  //console.log("sender is : "+ user1);
	  //console.log("avatar de sender : "+ user1.profile.avatar);
      return user1.profile.avatar;
	},
	getUserName:function( id){
		user1 = Meteor.users.findOne({_id:id});
		return user1.profile.username;
	},
	getEmoji:function(emoji_id){
	  var emoji = Emojis.findOne({alias: emoji_id });
      console.log(emoji.path);
	  return emoji.path;
	}

  })
  
  
  Template.chat_page.helpers({
    messages:function(){
      var chat = Chats.findOne({_id:Session.get("chatId")});
      return chat.messages;
    },
	emoticons: function(){
        return ["smile", "disappointed", "relieved", "angry"]
    },	
    other_user:function(){
      return ""
    } 
  })
  
  
  
 Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  'submit .js-send-chat':function(event){
    // stop the form from triggering a page reload
    event.preventDefault();
    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:Session.get("chatId")});
    if (chat){// ok - we have a chat to use
      var msgs = chat.messages; // pull the messages property
      if (!msgs){// no messages yet, create a new array
        msgs = [];
      }
      // is a good idea to insert data straight from the form
      // (i.e. the user) into the database?? certainly not. 
      // push adds the message to the end of the array
      // ok msgs.push({text: event.target.chat.value});
	  console.log("current alias value:"+emoti);
	  msgs.push({texto: event.target.chat.value, sender:Meteor.userId(), emoticon:emoti});
      // reset the form
      event.target.chat.value = "";
      // put the messages array onto the chat object
      chat.messages = msgs;
      // update the chat object in the database.
      ////Chats.update(chat._id, chat);
	  Meteor.call("updateChat",chat);
    }
  },
  "click .js-load-emoticon":function(event){
	  console.log(this);
  },
    "change #emoticon-select": function (event, template) {
        emoti = $(event.currentTarget).val();
        console.log("emoticon : " + emoti);
         // additional code to do what you want with the emoticon
		// event.currentTarget.value = "";
	
    }  
  
 })
 
}
// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123 

if (Meteor.isServer) {
//	Meteor.subscribe("users");

	Meteor.publish("chats", function() {
		    var filter = {$or:[
                {user1Id:this.userId}, {user2Id:this.userId} 
                ]};
		return Chats.find(filter);
	});
	Meteor.publish("users", function() {
		return Meteor.users.find();
	});
	Meteor.publish('emojis', function() {
		// Here you can choose to publish a subset of all emojis
		// if you'd like to.
	return Emojis.find();
	});
	
  Meteor.startup(function () {
    if (!Meteor.users.findOne()){
 		Meteor.call("addUsers");
    } 

  });
  
  
}


Meteor.methods({
	addUsers:function(){
		for (var i=1;i<9;i++){
        var email = "student"+i+"@test.com";
        var username = "student"+i;
        var avatar = "ava"+i+".png";
        console.log("creating a user with password 'test123' and username/ email: "+email);
        Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
        }
		
	},
	addChats:function(otherUserId) {
	    var currentUserId = Meteor.userId();
        if(currentUserId){ 
	       Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
		}
	},
	updateChat:function(chat) {
		var currentUserId = Meteor.userId();
        if(currentUserId){
	       Chats.update( chat._id, chat );
		}
	},
});

      