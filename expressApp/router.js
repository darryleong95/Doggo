var express = require('express');
var fs = require('fs');
var mysql = require('mysql');
var path = require('path');
var expressVue = require('express-vue');

// import routes
var searchPage = require('./routes/searchPage');
var home = require('./routes/home');
var aboutUs = require('./routes/about');

var app = express();

const vueOptions = {
    rootPath: path.join(__dirname, './view'),
    layout: {
        start: '<div id="app">',
        end: '</div>'
    }
};

const expressVueMiddleware = expressVue.init(vueOptions);
app.use(expressVueMiddleware);

app.use('/', home);
//app.use('/aboutUs', aboutUs);
app.use('/search', searchPage);

app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
	console.log('Server started on port ' + app.get('port'));
});

module.exports = app;
