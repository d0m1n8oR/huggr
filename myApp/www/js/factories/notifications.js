.service('notifications', [function($firebase, $window) {
	var ref = new Firebase("https://huggr.firebaseio.com/");
    /*var currentUser = JSON.parse($window.localStorage['userData'] || '{}');

    //watches for changes in data - maybe use bindTo?
    var obj = $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications")).$asObject();
    var unwatch = obj.$watch(function() {
        console.log("data changed!");
    });

	return {

	};*/
}])