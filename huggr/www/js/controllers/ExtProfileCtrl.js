.controller('ExtProfileCtrl', function($scope, $firebase, UserInfo, helper, localstorage, $stateParams, $state, toast, $q, huggActions) {
    //stuff with stateParams
    //In the hugg results when clicking on a offered hugg the user is refered to this page
    //The params are the profileID of the user that offers the hugg and the huggID
    //The huggID is needed so that the answer to the hugg can be mapped on the right huggID
    $scope.$on("$ionicView.enter", function(scopes, states) {    });

    //set stuff
    $scope.huggID = $stateParams.huggID;
    $scope.profileID = $stateParams.profileID;
    $scope.data = {age: null};
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");

    //get info from this user (PRofileID is in StateParams), deferred call
    var deferred = $q.defer();
    UserInfo.getProfile($scope.profileID).then(function(value) {
        $scope.data.age = value.age;
        $scope.data.picture = value.picture;
        $scope.data.lastSeenTime = value.lastSeenTime;
        $scope.data.displayName = value.displayName;
        $scope.data.hobby = value.hobby;
        $scope.data.profileID = value.profileID;
        $scope.data.numberHuggs = value.numberHuggs;
        $scope.data.rating = value.rating;
        $scope.data.firstName = value.firstName;
    }); //end getProfile

    //block a user from ever sending requests again
    $scope.blockUser = function blockUser(blockProfileID) {

        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("blocked").child(blockProfileID)).$set({
            0: blockProfileID
        }).then(function(y) {
            var blockHuggRef = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asArray();
            blockHuggRef.$loaded().then(function(data) {
                var i = 0;
                while (data.$keyAt(i) != null) {
                    $firebase(ref.child("hugg").child(data.$keyAt(i)).child("blocked").child(blockProfileID)).$set({
                        0: blockProfileID
                    });
                    var record = data.$getRecord(data.$keyAt(i));
                    if (record.answerProfileID == blockProfileID) {
                        //decline all huggs that the blocked user has with this user
                        huggActions.declineHugg($scope.currentUser, record.huggID, blockProfileID);
                    }
                    i++;
                }
                toast.pop("Blocked user");
                $state.go('app.home');
            });
        }); //end set

    }; //end function

    //answer to a hugg that the user of this currently shown profile has requested
    $scope.answerHugg = function answerHugg(huggID) {

        //accessing controller
        huggActions.answerHugg(huggID, $scope.currentUser, $scope.profileID);

    } //end function

    $scope.chatUserRef = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("chat")).$asArray();
    $scope.chatRef = $firebase(ref.child("chat")).$asArray();

    //start a new chat with the user
    //method checks whether there is already a chat open
    $scope.startChat = function startChat(otherProfileID) {
        
        otherProfileID = parseInt(otherProfileID);
        console.log(otherProfileID);
        
        $scope.chatUserRef.$loaded().then(function(data) {
            //check whether there has been a chat between the users
            if (data.$getRecord(otherProfileID) == null) {
                $scope.chatRef.$loaded().then(function(chatRefData) {
                    var newChatID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    while ($scope.chatRef.$getRecord(newChatID) != null) {
                        newChatID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    }
                    $firebase(ref.child("chat").child(newChatID)).$set({
                        profileIDA: $scope.currentUser.profileID,
                        profileIDB: otherProfileID,
                        chatID: newChatID
                    }).then(function(x) {
                        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("chat").child(otherProfileID)).$set({
                            otherProfileID: otherProfileID,
                            chatID: newChatID
                        }).then(function(y) {
                            $firebase(ref.child("users").child("data").child(otherProfileID).child("chat").child(otherProfileID)).$set({
                                otherProfileID: $scope.currentUser.profileID,
                                chatID: newChatID
                            }).then(function(y) {
                                $state.go('app.chat', {
                                    chatID: newChatID,
                                    chatTitle: $scope.data.displayName
                                });
                            });
                        })
                    })
                })
            } else {
                $scope.chatUserRef.$loaded().then(function(data) {
                    var chatID = data.$getRecord(otherProfileID).chatID;
                    $state.go('app.chat', {
                        chatID: chatID,
                        chatTitle: $scope.data.displayName
                    });
                })
            }
        })
    };

}) //end controller