var express = require('express')
const fs = require('fs');
var mysql = require('mysql')
var Promise = require('bluebird')
const dir_Crawlers = '../crawlers'
const dir_Data = '../data'

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "dogadoption"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  interval()
});

//Call this only
//interval()


function interval(){
  execute_me()
}

function execute_me(){
  setTimeout(function(){
    crawl_Add()
  }, 1000)
}
//Execute crawling function and save all entries into array
function crawl_Add(){
  fs.readdir(dir_Crawlers, (err, files) => {
    //console.log(files.length);
    for(let i = 0; i < files.length; i++){
      //console.log(files[i])
      let file_location = '../crawlers/'
      file_location += files[i]
      let file_to_crawl = require(file_location)
      file_to_crawl.callThis()
    }
  });
  console.log('done')
}

function deleteAdoptedDogs(){
  fs.readdir(dir_Data, (err, files) => {
    console.log(files[0])
    var file_location = '../data/'
    file_location += files[0]
    console.log(file_location)
    var file_to_check = require(file_location)
    console.log(file_to_check.Name[0])
    console.log(file_to_check.Source[0])
    let source = 'AFS'
    let query = 'SELECT * FROM doginformation WHERE Source = ?'
    con.query(query, source, (err,result) => {
      if(err) {
        throw err
      }
      for(var j = 0; j < result.length; j++){
        console.log(result[j].Name)
        if(file_to_check.Name.indexOf(result[j].Name) == -1){
          let delete_query = "DELETE FROM doginformation WHERE Name = ? AND Source = ?"
          con.query(delete_query, [result[j].Name, result[j].Source], (err,result) =>{
            console.log("input deleted")
          })
        }
      }
    })
  })
}

function updateDatabase(){
  for(let j = 0; j < dog_adoption_agency_Arr.length; j++){
    dog_adoption_agency = dog_adoption_agency_Arr[j]
    for(let i = 0; i < dog_adoption_agency.Name.length; i++){
      let dog_name = dog_adoption_agency.Name[i]
      let dog_source = dog_adoption_agency.Source[i]
      let dog_gender = dog_adoption_agency.Gender[i].toUpperCase()
      let dogInformation = {
        Name: dog_adoption_agency.Name[i],
        Gender: dog_adoption_agency.Gender[i].toUpperCase(),
        Breed: dog_adoption_agency.Breed[i],
        Source: dog_adoption_agency.Source[i],
        HDB: dog_adoption_agency.hdbStatus[i],
        Age: dog_adoption_agency.Age[i]
      }
      let q = "SELECT Name FROM doginformation WHERE Name= ? AND Source= ?"
      con.query(q, [dog_name,dog_source],(err,result) => {
        if(err){
          throw err
        }
        else{
          console.log(result)
          if(result.length == 0){
            //add into db
            let q2 = 'INSERT INTO doginformation SET ?'
            let query = con.query(q2, dogInformation, (err, result) => {
              if(err){
                throw err
              }
              console.log(result)
            })
          }
          else{
            console.log("Already present in database")
          }
        }
      });
    }
  }
}
