var express = require('express');
var fs = require('fs');
var mysql = require('mysql');
var path = require('path');
var expressVue = require('express-vue');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "dogadoption"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

exports.loadPage = function(req, res, next) {
  res.render('./view/searchPage', {title: 'Search page'});
};
