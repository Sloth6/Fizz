////////////////////////////////////////////////////////////////////////////////
/*
	index-controller.js
*/
////////////////////////////////////////////////////////////////////////////////


$('.signup-facebook').on('click', function() {
	console.log('I clicky the button');
	FB.login(function(response) {
		if (response.authResponse) {
			window.location += 'home';
		}
	});
});