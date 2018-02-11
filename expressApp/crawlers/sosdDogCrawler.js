var express = require('express');
var fs = require('fs');
var request = require('request');
var mysql = require('mysql')
var cheerio = require('cheerio');

var url = 'https://sosd.org.sg/adopt-a-dog/?dog=&gender=&hdb=&submit=Search&pageNum_rslisting=1'
var concat = '/?dog=&gender=&hdb=&submit=Search&pageNum_rslisting='
var urlx = 'https://sosd.org.sg/adopt-a-dog/?dog=&gender=&hdb=&submit=Search&pageNum_rslisting='
var baseUrl = 'https://sosd.org.sg'

var dogInformation = {
    Name: [],
    Gender: [],
    Breed : [],
    Age: [],
    Image: [],
    hdbStatus: [],
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
  request(url, function(error, response,body){
    if(!error){
      var $ = cheerio.load(body)
      var links = []
      var secondLinks = []
      links = $('a','.page-post-content .textwidget').text().split("")
      for(var i = 0; i < links.length/2; i++){
          if(!isNaN(links[i])){
            secondLinks.push(links[i])
          }
      }
      // console.log(secondLinks.toString())
      var highest = secondLinks[secondLinks.length-1]
      callMyself(highest)
    }
  })
}

function callMyself(highest){
  var urlToUse = urlx + highest
  request(urlToUse, function(error, response, body){
    if(!error){
      var $ = cheerio.load(body)
      var links = []
      var secondLinks = []
      links = $('a','.page-post-content .textwidget').text().split("")
      for(var i = 0; i < links.length; i++){
          if(!isNaN(links[i])){
            secondLinks.push(links[i])
          }
      }
      var x = secondLinks[secondLinks.length-1]
      if(highest-1 == x){
        // console.log('highest page number is ' + highest)
        // Call crawling function here
        pageCrawler(highest)
      }
      else{
        var highestVal = secondLinks[0];
        for(var i = 0; i < secondLinks.length-1; i++){
            if(secondLinks[i] > secondLinks[i+1]){
              highestVal = secondLinks[i]
            }
            else{
              highestVal = secondLinks[i+1]
            }
        }
        // console.log('Highest page number is not yet reached, calling method again now')
        callMyself(highestVal)
      }
    }
  })
}
var informationArr = []
var dogInformationLinkLocation = []

function pageCrawler(totalPage){
  var urlToUse = urlx + totalPage
  request(urlToUse, function(error,reponse,body){
    if(!error){
      var $ = cheerio.load(body)
      $('a','.page-post-content .wpc-product .wpc-title').each(function(){
        var href = $(this).attr('href')
        href = href.replace("..", "")
        informationArr.push(href)
      })
    }
    totalPage -= 1
    if(totalPage == 0){
      //no more to crawler
      // console.log("Crawling is complete")
      console.log(informationArr)
      doggieInfo(informationArr,0)
    }
    else{
      // console.log("crawling not done yet")
      pageCrawler(totalPage)
    }
  })
}

function doggieInfo(linkArray, index){
  var numArrElements = linkArray.length-1
  var linkToCrawl = baseUrl + linkArray[index]
  request(linkToCrawl, function(error, response, body){
    if(!error){
      var $ = cheerio.load(body)
      var text = $('p','.post .entry-content').text().split(/\n/)
      //sieve out Name
      var dogName = text[0].replace("Name", '').replace(":","").replace(/ /gi, "").replace(/\t/gi,"")
      dogInformation.Name.push(dogName)
      //sieve out DOB
      var dob = text[1].replace("Estimated DOB", '').replace(":", '').replace(/\t/gi,"")
      dogInformation.Age.push(dob)
      //sieve gender
      var genderFluidity = text[2].replace("Sex", "").replace(":",'').replace(/\t/gi,"").replace(/ /gi,"")
      dogInformation.Gender.push(genderFluidity)
      //sieve hdb status
      var hdbStatus = text[3].replace("HDB Approved", "").replace("ADORE","").replace(":",'').replace(/\t/gi,"").replace(/ /gi,"")
      var personalityOnward = hdbStatus.indexOf("Personality")
      hdbStatus = hdbStatus.substring(0,personalityOnward)
      var tempArr = []
      dogInformation.hdbStatus.push(hdbStatus)
      dogInformation.Source.push('SOSD')
      //sieve image links
      $('img','.wpc-product-img').each(function(){
          var imageLink = $(this).attr('src')
          var temp = []
          temp.push(imageLink)
          tempArr.push(temp)
      })
      dogInformation.Image.push(tempArr)
      dogInformation.Breed.push("unknown")
    }
    index += 1
    if(index > numArrElements){
      //done
      //create file with all information
      // fs.writeFile('../data/dogInformationSOSD.json', JSON.stringify(dogInformation), function(err){
      //     console.log('SOSD Json file updated!')
      // })
      add_Dogs_For_Adoption(dogInformation.Name.length)
    }
    else{
      doggieInfo(linkArray, index)
    }
  })
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
  con.query(query, 'SOSD', (err,result) =>{
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
