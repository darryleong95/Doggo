var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var searchPageController = require('../controllers/searchPageController');

router.get('/', searchPageController.loadPage);
//function(req, res) {
//   //Run crawler
//
//   //Delete
//
//
//   console.log('access search page');
//   let query = 'SELECT * FROM doginformation'
//   con.query(query, (err,result) => {
//     if(result == null){
//       res.send('no search results')
//     }
//     return res.renderVue('../view/searchPage', {title: 'searchPage', results: 'result'});
//   })
//  });

module.exports = router;
