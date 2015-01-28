.controller('dashboardCtrl', function($scope, $firebase) {
    var ref = new Firebase("https://huggr.firebaseio.com/");

    //show data from support Requests using Data Binding
    var supportObject = $firebase(ref.child("admin").child("support").orderByChild('time').limitToFirst(4)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo

    //Initialize object for Statistics
    $scope.statistics = {
        huggNumber: null,
        userNumber: null,
        chatNumber: null,
        chatMessages: null,
        connected: null
    }

    //Function to get Quick statistics
    $scope.getStats = function() {

        $scope.statistics.chatMessages = null;

        var huggObject = $firebase(ref.child("hugg")).$asObject();
        huggObject.$loaded().then(function(obj) {
            $scope.statistics.huggNumber = Object.keys(obj).length - 3;
        });

        var userObject = $firebase(ref.child("users").child("data")).$asObject();
        userObject.$loaded().then(function(obj) {
            $scope.statistics.userNumber = Object.keys(obj).length - 3;
        })

        var chatObject = $firebase(ref.child("chat")).$asObject();
        chatObject.$loaded().then(function(obj) {
            $scope.statistics.chatNumber = Object.keys(obj).length - 3;
            var i = 0;

            for (var key in obj) {
                if (obj.hasOwnProperty(key) && key != "$$conf" && key != "$id" && key != "$priority" && obj[key].message != null) {
                    $scope.statistics.chatMessages = $scope.statistics.chatMessages + Object.keys(obj[key].message).length;
                }
            }

        })
    }

    //function to check for connection
    $scope.connection = function() {
        var connectedRef = new Firebase("https://huggr.firebaseio.com/.info/connected");
        connectedRef.on("value", function(snap) {
            if (snap.val() === true) {
                $scope.statistics.connected = true;

            } else {
                $scope.statistics.connected = false;
            }
        });
    }

    //start function on startup
    $scope.connection();
    $scope.getStats();
})