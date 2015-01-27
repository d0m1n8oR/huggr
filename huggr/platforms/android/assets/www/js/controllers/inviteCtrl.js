.controller('inviteCtrl', function($scope, $cordovaContacts, $cordovaSocialSharing, toast) {
    $scope.getContactList = function() {
        $cordovaContacts.find({
            filter: '',
            multiple: true
        }).then(function(result) {
            $scope.contacts = result;
        }, function(error) {
            console.log("ERROR: " + error);
        });
    };

    var message = "Hey! I am in dire need of a hug! I am using this cool new app huggr and it would be great to have you here to hug me :)";
    var subject = "Hug me on huggr!";
    var file = "file";
    var link = "https://github.com/a3rosol/huggr";
    var image = "https://github.com/a3rosol/huggr/blob/master/huggr/www/img/icon.png"

    $scope.share = function() {
        $cordovaSocialSharing.share(message, subject, file, link) // Share via native share sheet
            .then(function(result) {
                toast.pop("Thanks for spreading the word!");
            }, function(err) {
                console.log(err);
            });

    }

    $scope.tweet = function() {
        $cordovaSocialSharing
            .shareViaTwitter(message, image, link)
            .then(function(result) {
                toast.pop("Thanks for spreading the word!");
            }, function(err) {
                console.log(err);
            });
    }
    $scope.wapp = function() {
        $cordovaSocialSharing
            .shareViaWhatsApp(message, image, link)
            .then(function(result) {
                toast.pop("Thanks for spreading the word!");
            }, function(err) {
                console.log(err);
            });
    }
    $scope.fb = function() {
      $cordovaSocialSharing
           .shareViaFacebook(message, image, link)
           .then(function(result) {
                toast.pop("Thanks for spreading the word!");
           }, function(err) {
             console.log(err);
           });

    }
    $scope.sms = function() {
  // access multiple numbers in a string like: '0612345678,0687654321'
         $cordovaSocialSharing
           .shareViaSMS(message)
           .then(function(result) {
                toast.pop("Thanks for spreading the word!");
           }, function(err) {
             console.log(err);
           });
    }
    $scope.mail = function() {
         // TO, CC, BCC must be an array, Files can be either null, string or array
         $cordovaSocialSharing
           .shareViaEmail(message, subject)
           .then(function(result) {
                toast.pop("Thanks for spreading the word!");
           }, function(err) {
             console.log(err);
           });
    }


})
