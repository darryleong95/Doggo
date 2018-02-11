//var express = require('express')
var fs = require('fs');
var mysql = require('mysql')

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "dogadoption"
});

con.connect(function(err) {
  if (err) throw err;
  let dog_name = 'asdasd'
  let query = "SELECT Name FROM doginformation WHERE Name= ?"
  con.query(query, [dog_name],(err,result) =>{
    if(err) throw err
    console.log(result)
    console.log(result.length)
    if(result.length == 0){
      console.log("Result does not exist")
    }
    else console.log("Result exists")
  })
});
