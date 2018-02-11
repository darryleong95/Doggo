var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var mysql = require('mysql')

var url = 'https://www.causesforanimals.com/casac-dogs4adoption.html'
var puppyClub = 'https://www.causesforanimals.com/puppy-club.html'
var baseUrl = 'https://www.causesforanimals.com'

var dogInformation = {
    Name: [], //done
    Gender: [], //done
    Breed : [], //done
    Age: [], //done
    Image: [], //done
    hdbStatus: [], //done
    Source: []
};

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
  var links = []
  var second_links = []
  var imageLink = []
  var second_imageLink = []
  request(url, function(error, response, body){
    if(!error){
      var $ = cheerio.load(body)
      $("a",".wsite-image").each(function(){
          var infoLink = $(this).attr('href')
          links.push(infoLink)
      })

      var length = links.length-6
      //wsite-image wsite-image-border-thin
      $("img",".wsite-multicol-tr .wsite-multicol-col .wsite-image").each(function(){
          //console.log($(this).attr('src'))
          imageLink.push($(this).attr('src'))
      })
      for(var x = 4; x < links.length-10; x++){
        second_links.push(links[x])
      }
      for(var x = 4; x < imageLink.length-10; x++){
        second_imageLink.push(imageLink[x])
      }
      for(var i = 0; i <second_imageLink.length; i++){
        dogInformation.Image.push(imageLink[i])
      }
      for(var  i = 0; i < second_links.length; i++){
        var dogName = second_links[i].replace('/',"").replace('.html',"").replace('--'," ").replace('-'," ")
        dogInformation.Name.push(dogName)
      }
      crawlingFunction(second_links, 0)
    }
  })
}

function crawlingFunction(link, index){
  var urlToUse = baseUrl + link[index]
  // console.log(urlToUse)
  request(urlToUse, function(error, respose, body){
    if(!error){
      var $ = cheerio.load(body)
      var content = $('.paragraph','.wsite-multicol-table .wsite-multicol-tbody .wsite-multicol-tr .wsite-multicol-col').text()
      //Sieve out age
      var dob = content.indexOf('DOB')
      var location = content.indexOf('Location')
      var dobOnward = content.substring(dob,location).replace("DOB","").replace(":","")
      dogInformation.Age.push(dobOnward)
      //Sieve out Gender
      var gender;
      if(content.indexOf('Female') > -1){
        gender = 'Female'
      }
      else if(content.indexOf('Male') > -1){
        gender = 'Male'
      }
      else{
        //shitty web formatting
        content = $('.paragraph', '.wsite-elements.wsite-not-footer').text()
        //console.log(content)
        if(content.indexOf('female') > -1){
            gender = 'Female'
        }
        else if(content.indexOf('male') > -1){
            gender = 'Male'
        }
        else{
          //burden site
          content.toLowerCase()
          if(content.indexOf('her') > -1 || content.indexOf('she') > -1){
            gender = 'Female'
          }
          else{
            gender = 'Male'
          }
        }
      }
      dogInformation.Gender.push(gender)
      //HDB status
      var hdbStatus
      var hdbContent = content.toLowerCase();
      if(hdbContent.indexOf('not hdb approved') > -1 ){
        hdbStatus = 'No'
      }
      else if(hdbContent.indexOf('hdb approved') > -1){
        hdbStatus = 'Yes'
      }
      else{
        //no indicator
        hdbStatus = 'Unknown'
      }
      dogInformation.hdbStatus.push(hdbStatus)
      //Get breed
      var breedContent = content.toLowerCase()
      var breed
      if(breedContent.indexOf('breed:') > -1){
        var breedPosition = breedContent.indexOf('breed:')
        var genderPosition = breedContent.indexOf('gender')
        breed = breedContent.substring(breedPosition,genderPosition)
        breed = breed.replace('breed:',"").replace(" ",'')
      }
      else{
        breed = 'Unknown'
      }
      // console.log(breed)
      dogInformation.Breed.push(breed)
      //push Source
      dogInformation.Source.push('CFA')
      //done crawling information
      index+=1
      if(index > link.length-1){
        add_Dogs_For_Adoption(dogInformation)
        // fs.writeFile('../data/dogInformationCFA.json', JSON.stringify(dogInformation), function(err){
        //   console.log('CFA Json file updated!')
        // })
      }
      else{
        crawlingFunction(link,index)
      }
    }
  })
}

function add_Dogs_For_Adoption(dogInformation){
  console.log('Query execution below')
  for(let i = 0; i < dogInformation.Name.length; i++){
    let name = dogInformation.Name[i]
    let source = dogInformation.Source[i]
    let age = dogInformation.Age[i]
    let breed = dogInformation.Breed[i]
    let gender = dogInformation.Gender[i].toUpperCase()
    let hdb = dogInformation.hdbStatus[i]
            console.log(dogInformation)
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
          console.log(i)
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

function delete_Adopted_Dogs(dogInformation1){
  var query = "SELECT * FROM doginformation WHERE Source = ?"
  con.query(query, 'CFA', (err,result) =>{
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
