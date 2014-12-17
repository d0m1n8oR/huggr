function login(authProvider) {
    if (authProvider == "google") {
        fbRef.authWithOAuthPopup("google", function(err, user) {
            if (err) {
                console.log(err);
            }
            if (user) {
                fbRef.onAuth(function(authData) {
                    var userSigninIdentifier = authData.google.id;
                    googleRef.once("value", function(checkSnapshot) {
                        if (checkSnapshot.hasChild(userSigninIdentifier)) {

                            googleRef.child(userSigninIdentifier).once("value", function(snapshot) {
                                var profileID = snapshot.val().profileID;

                                //update data in db
                                googleRef.child(userSigninIdentifier).update({
                                    token: authData.token,
                                    expires: authData.expires,
                                    AccessToken: authData.google.accessToken
                                });

                                dataRef.child(profileID).update({
                                    displayName: authData.google.displayName,
                                    email: authData.google.email,
                                    picture: authData.google.cachedUserProfile.picture
                                });

                                window.open('../../index.html', '_self', false);

                            }); //function(snapshot) 

                        } //if(snapshot.hasChild(userSigninIdentifier))
                        else {
                            register(authProvider, authData);
                        }

                    }); //function(snapshot)
                }); //function(authData)
            }

        }, {
            scope: "email"
        }); //function(err, user)
    } //if(provider == "google")

    if (authProvider == "facebook") {

        fbRef.authWithOAuthPopup("facebook", function(err, user) {

            if (err) {
                console.log(err);
            }
            if (user) {
                fbRef.onAuth(function(authData) {
                    var userSigninIdentifier = authData.facebook.id;

                    facebookRef.once("value", function(checkSnapshot) {

                        if (checkSnapshot.hasChild(userSigninIdentifier)) {

                            facebookRef.child(userSigninIdentifier).once("value", function(snapshot) {
                                var profileID = snapshot.val().profileID;

                                //update data in db
                                facebookRef.child(userSigninIdentifier).update({
                                    token: authData.token,
                                    expires: authData.expires,
                                    AccessToken: authData.facebook.accessToken
                                });
                                dataRef.child(profileID).update({
                                    displayName: authData.facebook.displayName,
                                    email: authData.facebook.email,
                                    picture: authData.facebook.cachedUserProfile.picture.data.url
                                });

                                window.open('../../index.html', '_self', false);
                            });

                        } //if (checkSnapshot.hasChild(userSigninIdentifier))
                        else {
                            register(authProvider, authData);
                        }

                    }); //function(checkSnapshot)

                }); //function(authData)


            } //if(user)

        }, {
            scope: "email"
        });

    } //(authProvider=='facebook')

}; //function login(provider)

function register(authProvider, authData) {

    var newProfileID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

    dataRef.once("value", function(snapshot) {
        while (snapshot.hasChild(newProfileID.toString())) {
            newProfileID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
        }

        if (authProvider == "google") {
            //write authentification data into database
            googleRef.child(authData.google.id).set({
                displayName: authData.google.displayName,
                token: authData.token,
                expires: authData.expires,
                uid: authData.uid,
                ID: authData.google.id,
                AccessToken: authData.google.accessToken,
                profileID: newProfileID
            });

            //write user data into database
            dataRef.child(newProfileID).set({
                profileID: newProfileID,
                googleID: authData.google.id,
                displayName: authData.google.displayName,
                email: authData.google.email,
                picture: authData.google.cachedUserProfile.picture,
                gender: authData.google.cachedUserProfile.gender,
                firstname: authData.google.cachedUserProfile.given_name,
                lastname: authData.google.cachedUserProfile.family_name
            });
        }
        if (authProvider == "facebook") {
            //write authentification data into database
            facebookRef.child(authData.facebook.id).set({
                displayName: authData.facebook.displayName,
                token: authData.token,
                expires: authData.expires,
                uid: authData.uid,
                ID: authData.facebook.id,
                AccessToken: authData.facebook.accessToken,
                profileID: newProfileID
            });

            //write user data into database
            dataRef.child(newProfileID).set({
                profileID: newProfileID,
                googleID: null,
                facebookID: authData.facebook.id,
                displayName: authData.facebook.displayName,
                email: authData.facebook.email,
                picture: authData.facebook.cachedUserProfile.picture.data.url,
                gender: authData.facebook.cachedUserProfile.gender,
                firstname: authData.facebook.cachedUserProfile.first_name,
                lastname: authData.facebook.cachedUserProfile.last_name

            });
        }
        window.open('../../index.html', '_self', false);

    }); //function(snapshot)

}; //function register(authProvider)

function checkWhetherLoggedIn() {

    def = $.Deferred();

    var authData = fbRef.getAuth();
    if (authData) {
        var provider = authData.provider;

        //load profileID
        if (provider == "google") {
            googleRef.child(authData.google.id).once("value", function(snapshot) {
                def.resolve(snapshot.val().profileID);
            });
        }

        if (provider == "facebook") {
            facebookRef.child(authData.facebook.id).once("value", function(snapshot) {
                def.resolve(snapshot.val().profileID);
            });
        }

    } else {
        //user is not logged in
        window.open('/content/login.html', '_self', false);
        def.resolve("not logged in");

    }
    return def.promise();
};

function logOut() {
    fbRef.unauth();
    window.open('/content/login.html', '_self', false);
};
