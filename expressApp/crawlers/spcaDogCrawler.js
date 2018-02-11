var express = require('express');
var fs = require('fs');
var mysql = require('mysql')
var request = require('request');
var cheerio = require('cheerio');

var url = 'http://www.spca.org.sg/services.asp?Page='
var concact = '&cat=1&view=&senior=&sColorCode=';

var dogInformation = {
    Name: [],
    Gender: [],
    Breed : [],
    Age: [],
    Image: [],
    hdbStatus: [],
    Source: []
};

var uncleanedNames = []
var links = []
var pagenumbers = []
var information = [];

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "dogadoption"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  exports.callThis()
});

exports.callThis = function(){
  request(url, function(error, response, html){
      if(!error){
          var $ = cheerio.load(html);
          //Find out number of pages
          links = $('.alink', '.content').text().split(" ")
          for(var i = 0; i < links.length; i++){
              if(links[i].indexOf("2") > -1){
                  pagenumbers = links[i].split("");
              }
          }
          var lengthOfPageNumberArray = pagenumbers.length
          //Sort out page numbers into an array
          for(var i = 0; i < pagenumbers.length; i++){
              if(pagenumbers[i].indexOf("9") > -1){
                  var tracker = i+1;
                  for(var j = tracker; j < pagenumbers.length; j+=2){
                      if(j >= pagenumbers.length){
                          break;
                      }
                      pagenumbers[tracker] = pagenumbers[j] + pagenumbers[j+1]
                      pagenumbers[j+1] = 0
                      tracker++
                  }
                  break;
              }
          }
          //push 1 into the arr
          pagenumbers.unshift(1);
          crawlerFunction(pagenumbers);
      }
  })
}

function crawlerFunction(arr){
    var total_entries_content = 0
    for(var i = 0; i < arr.length; i++){
        //console.log(arr[i])
        if(arr[i] === 0){
            //console.log("break point")
            break;
        }
        finalUrl = url + arr[i] + concact
        // CORRECT
        request(finalUrl, function(error, response, html){
            var $ = cheerio.load(html)
            //Crawler Functions
            hdbCrawler($)
            nameCrawler($)
            imageCrawler($)
            total_entries_content += contentCrawler($)
        })
    }
    setTimeout(function(){
      if(total_entries_content == dogInformation.Name.length){
        add_Dogs_For_Adoption(total_entries_content)
      }
    }, 10000)
}

function add_Dogs_For_Adoption(total_entries_content){
  var flag = false
  if(dogInformation.Name.length == total_entries_content){
    console.log('Query execution below')
    for(let i = 0; i < dogInformation.Name.length; i++){
      let name = dogInformation.Name[i]
      let source = dogInformation.Source[i]
      let age = dogInformation.Age[i]
      let breed = dogInformation.Breed[i]
      let gender = dogInformation.Gender[i].toUpperCase()
      let hdb = dogInformation.hdbStatus[i]
      var query = 'SELECT * FROM doginformation WHERE Name = ? AND Source = ? AND Age = ?'
      con.query(query, [name, source, age], (err,result) =>{
        if(err) {
          throw err
        }
        else{
          if(result.length == 0){
            //add into db
            let insert_this = {
              Name: name,
              Gender: gender,
              Breed: breed,
              Source: source,
              HDB: hdb,
              Age: age
            }
            let q2 = 'INSERT INTO doginformation SET ?'
            con.query(q2, insert_this, (error, results) => {
              if(error){
                throw error
              }
              else{
                if(i == dogInformation.Name.length-1){
                  console.log('DELETING CHECK STARTS HERE')
                  setTimeout(function(){
                    delete_Adopted_Dogs(dogInformation)
                  },1000)
                }
              }
            })
          }
          else{
            if(i == dogInformation.Name.length-1){
              console.log('DELETING CHECK STARTS HERE')
              setTimeout(function(){
                delete_Adopted_Dogs(dogInformation)
              },1000)
            }
          }
        }
      })
    }
  }
  else {
    console.log('whole programme has not been finished')
  }
}

function delete_Adopted_Dogs(dogInformation1){
  var query = "SELECT * FROM doginformation WHERE Source = ?"
  con.query(query, 'SPCA', (err,result) =>{
    if(err){
      throw err
    }
    else{
      if(result.length == 0){
        console.log('Database for ' + dogInformation1.Source[0] + " is empty")
      }
      else{
        for(let m = 0; m < result.length; m++){
          let result_Name = result[m].Name
          let flag = true //default true - not found: delete
          for(let j = 0; j < dogInformation1.Name.length; j++){
            let dogInformation_Name = dogInformation1.Name[j]
            if(dogInformation_Name == result_Name){
              //found - make false
              console.log('Dog has yet to be adopted')
              flag = false
            }
          }
          if(flag == true){
            query = "DELETE FROM doginformation WHERE Name = ? AND Age = ? AND Source =?"
            let name_1 = result[m].Name
            let age_1 = result[m].Age
            let source_1 = result[m].Source
            con.query(query, [name_1,age_1,source_1], (err,result) =>{
                console.log(name_1 + " has been deleted from the Database")
            })
          }
        }
      }
    }
  })
}

function hdbCrawler($){
    var dogNames = $('b', '.content').text()
    var startIndex = 0
    var index
    var searchStrLen = 'HDB Approved'.length
    //If matches found `not hdb approved` and `hdb approved`
    while ((index = dogNames.indexOf('HDB Approved', startIndex)) > -1) {
        if(dogNames.substring(index-4, index+12) === 'Not HDB Approved'){
            // Not HDB approved
            dogInformation.hdbStatus.push('No')
        }
        else{
            // HDB approved
            dogInformation.hdbStatus.push('Yes')
        }
        startIndex = index + searchStrLen;
    }
}

function nameCrawler($){
    var dogNames = $('b', '.content').text()
    dogNames = dogNames.replace(/\s/gi, '')
    dogNames = dogNames.replace(/dogs/gi, '')
    dogNames = dogNames.replace(/page:/gi, '')
    dogNames = dogNames.replace(/nothdbapproved/gi, ' ')
    dogNames = dogNames.replace(/hdbapproved/gi, ' ')
    dogNames = dogNames.replace(/  /gi, ' ')
    uncleanedNames = dogNames.split(" ")
    //dogInformation.Name.push(uncleanedNames)
    //console.log(uncleanedNames.toString())
    for(var i = 0; i < uncleanedNames.length; i++){
        if(uncleanedNames[i].trim() === ""){
            break;
        }
        else{
            dogInformation.Name.push(uncleanedNames[i])
        }
    }

}

function imageCrawler($){
    $('img','td').each(function(){
        var halfImgUrl = $(this).attr('src');
        if(halfImgUrl.indexOf('pictures_adoptiongallery') > -1){
            var fullImgUrl = 'http://www.spca.org.sg/' + halfImgUrl
            var temp = []
            temp.push(fullImgUrl)
            dogInformation.Image.push(temp)
        }
    })
}

function contentCrawler($){
    var total = 0
    $('.content').each(function(){
        var content = $.text().replace(/,/gi, "")
        content = content.replace(/\t/gi, "")
        content = content.replace(/\n/gi, "")
        information = content.split(" ")
        for(var i = 0; i < information.length; i++){
            if(information[i].indexOf("Breed:") > -1) {
                var breedName = ""
                for(var j = i+1; j < information.length; j++){
                    if(information[j] != "")
                        if(information[j+1] == "")
                            breedName = breedName + information[j]
                        else{
                            breedName = breedName + information[j] + " "
                        }
                    else{
                        break;
                    }
                }
                dogInformation.Breed.push(breedName)
            }
            if(information[i].indexOf("Gender:") > -1) {
                var gender = ""
                for(var j = i+1; j < information.length; j++){
                    if(information[j] != ""){
                        if(information[j+1] == "")
                            gender = gender + information[j]
                        else{
                            gender = gender + information[j] + " "
                        }
                    }
                    else{
                        break;
                    }
                }
                dogInformation.Gender.push(gender)
                //add Source

                dogInformation.Source.push('SPCA')
            }
            if(information[i].indexOf("Age:") > -1) {
                var age = ""
                for(var j = i+1; j < information.length; j++){
                    if(information[j] != ""){
                        if(information[j+1] == "")
                            age = age + information[j]
                        else{
                            age = age + information[j] + " "
                        }
                    }
                    else{
                        break;
                    }
                }
                dogInformation.Age.push(age)
                total++
            }
        }
        return false;
    })
    //console.log(dogInformation.Age.length)
    return total
}
