angular.module('starter.controllers', ['firebase'])

.controller('AppCtrl', function($scope) {
})

.controller('StoresCtrl', function($scope, $rootScope, $ionicModal, $firebase, $ionicLoading, angulargmContainer, $ionicPopup, $ionicActionSheet) {
	
	$scope.options = {
		map: {
			center: $rootScope.geoloc,
			zoom: 15,
		},
	};
  
	

    $scope.now = new Date().getTime();
    $scope.Math = window.Math;
    $scope.moment = window.moment;

	$scope.triggerOpenInfoWindow = function(store) {
		$scope.markerEvents = [
		  {
		    event: 'openinfowindow',
		    ids: [store.id]
		  },
		];
	}

	$scope.hasSteaks = function(store, value, index) {

		$ionicPopup.alert({
			title: 'Thank You',
			template: 'We will look into that'
		});

		$rootScope.stores.splice(index,1)

		var strikesCount
		$rootScope.storesRef.child('stores/'+store.id+'/hasSteaks/strikes').transaction(function(strikes) {
			strikesCount = strikes + 1;
			return strikesCount;
		});

		if (strikesCount >=3){
			$rootScope.storesRef.child('stores/'+store.id+'/hasSteaks/value').transaction(function(value) {
				return false;
			});
		}


	}

	//set up the modal to pick the cut of meat
	$ionicModal.fromTemplateUrl('templates/steak-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});

	//reinitalize map & prices when user picks a new cut of meat
	//ref: http://ionicframework.com/docs/api/service/$ionicModal/
	$scope.closeModal = function(cut) {
		if(typeof cut === 'undefined'){
			//hide the modal
			$scope.modal.hide();
		} else {
			//set the new cut
			$rootScope.steak.cut = cut;

            var previousPrice;
            var uniquePrices = 0;
            var markerNumber;
            var multiplier;
            var counter =0;

            //First we need to sort the stores by price
            $rootScope.stores.sort(function(a, b){
                return a.cuts[$rootScope.steak.cut].price-b.cuts[$rootScope.steak.cut].price
            })
            //Then we count how many unique prices there are so we can assign the correct multiplier for the marker
            for (var i = 0; i < $rootScope.stores.length; i++){
                if($rootScope.stores[i].cuts[$rootScope.steak.cut].price != previousPrice){
                    uniquePrices++
                    previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;
                } 
            }

            //Then we are going to assign color of marker based on how many unique prices there are
            previousPrice = 0;
            if (uniquePrices <= 4){
                for (var i = 0; i < $rootScope.stores.length; i++){
                    multiplier = 5;
                    markerNumber = i+1;
                    
                    if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                        pin = multiplier * (counter - 1);
                    } else {
                        pin = multiplier * counter;
                        counter++;
                    }
                    $rootScope.stores[i].pin = pin;
                    $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                    previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;
           		}
            } else if(uniquePrices > 4 && uniquePrices <= 7){
                for (var i = 0; i < $rootScope.stores.length; i++){
                    multiplier = 3;
                    markerNumber = i+1;
                    
                    if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                        pin = multiplier * (counter - 1);
                    } else {
                        pin = multiplier * counter;
                        counter++;
                    }
                    $rootScope.stores[i].pin = pin;
                    $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                    previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;
            	}
            } else if(uniquePrices > 7 && uniquePrices <= 11){
                for (var i = 0; i < $rootScope.stores.length; i++){
                    multiplier = 2;
                    markerNumber = i+1;
                    
                    if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                        pin = multiplier * (counter - 1);
                    } else {
                        pin = multiplier * counter;
                        counter++;
                    }
                    $rootScope.stores[i].pin = pin;
                    $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                    previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;

                }
            } else {
                for (var i = 0; i < $rootScope.stores.length; i++){
                    multiplier = 1;
                    markerNumber = i+1;
                    
                    if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                        pin = multiplier * (counter - 1);
                    } else {
                        pin = multiplier * counter;
                        counter++;
                    }
                    $rootScope.stores[i].pin = pin;
                    $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                    previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;                        
                }
            }



			if ($rootScope.sortBy == 'distance'){
			    $rootScope.stores.sort(function(a, b){
                    return a.distance.distM-b.distance.distM
                })
                for (var i = 0; i < $rootScope.stores.length; i++){
                	markerNumber = i+1;
                	$rootScope.stores[i].marker = '<div class="pin bounce pin-'+$rootScope.stores[i].pin+'"><div class="num">'+markerNumber+'</div></div>';
                }
			}
			//hide the modal
			$scope.modal.hide();
		}
	};

	$scope.resizeMap = function() {
		//var center = map.getCenter();
		window.setTimeout(function(){
			$scope.options.map.center = $rootScope.geoloc;
			$scope.options.map.zoom = 14;
			$scope.$broadcast('gmMapResize', 'infoWindows');
			//$scope.$broadcast('gmMarkersRedraw', 'infoWindows');
			$scope.$broadcast('gmMarkersUpdate', 'infoWindows');
			$scope.$apply();
		},100);
	};

	// Triggered on a button click, or some other target
	 $scope.sortBy = function() {

	   // Show the action sheet
	   var hideSheet = $ionicActionSheet.show({
	     buttons: [
	       { text: 'Price' },
	       { text: 'Distance' }
	     ],
	     titleText: 'Sort Stores By',
	     cancelText: 'Cancel',
	     cancel: function() {
	          // add cancel code..
	        },
	     buttonClicked: function(index) {
			if (index == 0 && $rootScope.sortBy != 'price'){
				$rootScope.sortBy = 'price';
                $rootScope.stores.sort(function(a, b){
                    return a.cuts[$rootScope.steak.cut].price-b.cuts[$rootScope.steak.cut].price
                })
                for (var i = 0; i < $rootScope.stores.length; i++){
                	markerNumber = i+1;
                	$rootScope.stores[i].marker = '<div class="pin bounce pin-'+$rootScope.stores[i].pin+'"><div class="num">'+markerNumber+'</div></div>';
                }
			} else if (index == 1 && $rootScope.sortBy != 'distance'){
				$rootScope.sortBy = 'distance';
			    $rootScope.stores.sort(function(a, b){
                    return a.distance.distM-b.distance.distM
                })
                for (var i = 0; i < $rootScope.stores.length; i++){
                	markerNumber = i+1;
                	$rootScope.stores[i].marker = '<div class="pin bounce pin-'+$rootScope.stores[i].pin+'"><div class="num">'+markerNumber+'</div></div>';
                }
			} 
			return true;
	     }
	   });

	 };


})


.controller('StoreCtrl', function($scope, $rootScope, $http, $stateParams, $firebase, $timeout) {
	// Set Firebase connection
	//var storesRef = new Firebase('https://steakbuddy.firebaseio.com/places/stores/' + $stateParams.storeId);
	var sync = $firebase($rootScope.storesRef.child('stores/'+$stateParams.storeId));
	$scope.store_id = $stateParams.storeId;
	$scope.storeIndex = $stateParams.storeIndex;
	$scope.editorEnabled = false;


	var record = sync.$asObject();
	record.$loaded().then(function() {

	});

	// we can add it directly to $scope if we want to access this from the DOM
	$scope.store = record;

	$scope.test = 0.00;
})

.controller('loginCtrl', function($scope, $rootScope, $firebase, $firebaseSimpleLogin, $ionicModal) {
	
	// Get a reference to the Firebase
	var firebaseRef = new Firebase("https://steakbuddy.firebaseio.com/");	

	$scope.nativeFacebookLogin = function() {
		facebookConnectPlugin.login(['email'], facebookConnectSuccess, facebookConnectError);
	};

	var facebookConnectSuccess = function (status) {
		facebookConnectPlugin.getAccessToken(function(token) {
			// Authenticate with Facebook using an existing OAuth 2.0 access token
			firebaseRef.authWithOAuthToken("facebook", token, function(error, authData) {
				if (error) {
					console.log('Firebase login failed!', error);
				} else {
					console.log('Authenticated successfully with payload:', authData);
					addFacebookUser(authData);
				}
			});
		}, function(error) {
	    	console.log('Could not get access token', error);
		});
	}
	var facebookConnectError = function (error) {
		console.log('An error occurred logging the user in', error);
	}

	function addFacebookUser(authData){
		firebaseRef.child('users').child(authData.uid).once('value', function(snapshot) {
			var firebaseUser = snapshot.val();
			if (firebaseUser == null) {
			    // User logged in with facebook and doesnt exist lets add em
			    var timestamp = new Date().getTime();
			    var userObject = {
					provider: authData.provider,
					uid: authData.uid,
					displayName: authData.facebook.displayName,
					first_name: authData.facebook.cachedUserProfile.first_name,
					last_name: authData.facebook.cachedUserProfile.last_name,
					picture: '',
					gender: authData.facebook.cachedUserProfile.gender,
					email: authData.facebook.email,
					total_points: 1,
					points: [{date:timestamp, action:'New User', value: 1}]
				}
				firebaseRef.child('users').child(authData.uid).set(userObject);
				$rootScope.user = userObject;
			} else {
				// User exists.
				$rootScope.user = firebaseUser;
			}
			$rootScope.$apply();
		});
	}

	$scope.facebookPopupLogin = function() {
		firebaseRef.authWithOAuthPopup("facebook", function(error, authData) {
			if (authData) {
				addFacebookUser(authData);
				// the access token will allow us to make Open Graph API calls
				console.log(authData.facebook.accessToken);
			}
		}, {
			scope: "email" // the permissions requested
		});
	}

	// Logs a user in with the angularfire's password provider using simplelogin
	$scope.loginPasswordUser = function(email, password) {
		firebaseRef.authWithPassword({
			email    : email,
			password : password
		}, function(error, authData) {
			if (error === null) {
				// user authenticated with Firebase
				console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
				firebaseRef.child('users').child(authData.uid).once('value', function(snapshot) {
					var firebaseUser = snapshot.val();
					$rootScope.user = firebaseUser;
					$rootScope.$apply();
				});
			} else {
				console.log("Error authenticating user:", error);
			}
		});
	};

	// Logs a user out
	$scope.logout = function() {

		$rootScope.user = null;
		firebaseRef.unauth();
		/*
		window.cookies.clear(function() {
			console.log("Cookies cleared!");
		});
		*/
	};

	//set up the modal to pick the cut of meat
	$ionicModal.fromTemplateUrl('templates/createUser-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});

	$scope.createUser = function(email, password, first_name) {
		firebaseRef.createUser({
			email    : email,
			password : password
		}, function(error) {
			if (error === null) {
				console.log("User created successfully");
				firebaseRef.authWithPassword({
					email    : email,
					password : password
				}, function(error, authData) {
					if (error === null) {
						// user authenticated with Firebase lets add him... or her to our collection
						var timestamp = new Date().getTime();
						var userObject = {
							provider: authData.provider,
							displayName: '',
							first_name: first_name,
							last_name: '',
							picture: '',
							gender: '',
							email: authData.password.email,
							total_points: 1,
							points: [{date:timestamp, action:'New User', value: 1}]
						}
						firebaseRef.child('users').child(authData.uid).set(userObject);
						$rootScope.user = userObject;
						$rootScope.$apply();
						console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
					} else {
						console.log("Error authenticating user:", error);
					}
				});

			} else {
				console.log("Error creating user:", error);
			}
		});
		//hide the modal
		$scope.modal.hide();
	}

});
