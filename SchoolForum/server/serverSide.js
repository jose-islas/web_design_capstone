points = new Meteor.Collection('pointsCollection');
console.log("points from serverside");
Features = new Meteor.Collection('features');

//var canvas;

Meteor.methods({
  'clear': function () {
    points.remove({});
  },
  'addFeatures':function(){
        var color = "black";
        var  brush = "pensil";
        var thikness = 1;
        Features.insert( {color:color, brush:brush,thikness:thikness});
	},
	'updateBrush':function(brush) {
		var current_feature = Features.findOne();
        if(current_feature){
			console.log("brush in update: " + brush);
			Features.update( current_feature._id, {$set: {brush:brush}} );
		}	
		   
	},
	'getColor':function(){
      return Features.findOne().color;
    },
	
	'save':function(){
		console.log("save method ");
	}
});

