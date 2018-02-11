var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

var url = 'http://asdsingapore.com/wp/adopt-a-dog/'
var baseUrl = 'http://asdsingapore.com'

let dogInfoLinks = []

var dogInformation = {
    Name: [], // done
    Gender: [], // done
    Breed : [], // done
    Age: [], // done
    Image: [],
    hdbStatus: [], // done
    Source:[] // done
}

exports.callThis = function(){
  // var pageLinks = []
  // request(url, function(error, response, body){
  //   var $ = cheerio.load(body)
  //   $('a','.posts-wrap').each(function(){
  //     var link = $(this).attr('href')
  //     if(link.indexOf('/?page=') > -1){
  //       pageLinks.push(link)
  //     }
  //   })
  //   var x = pageLinks.length-1
  //   var temp = pageLinks[x].indexOf('page=')
  //   var totalPages = pageLinks[x].substring(temp+5)
  //   console.log(totalPages)
  //   dogInfoLink(totalPages, dogInformationHandler)
  // })
}

let dogInfoLink = function(totalPages, callback){
//Count downwards
  var urlToUse = 'http://asdsingapore.com/wp/adopt-a-dog/' + totalPages + '/'
  // console.log(urlToUse)
  request(urlToUse, function(error, response, body){
    if(!error){
      let $ = cheerio.load(body)
      //console.log($('a','.posts-wrap table').text())
      $('a','.posts-wrap table').each(function(){
        let link = $(this).attr('href')
        let id = link.substring(link.indexOf('=')+1)
        let first_half = 'http://asdsingapore.com/wp/wp-content/themes/campaign/adopt-about.php?id='
        if(link.indexOf(first_half) > -1 && dogInfoLinks.indexOf('http://asdsingapore.com/wp/wp-content/themes/campaign/adopt-about-iframe.php?id='+id) == -1){
          dogInfoLinks.push('http://asdsingapore.com/wp/wp-content/themes/campaign/adopt-about-iframe.php?id=' + id)
        }
      })
      $('img', '.lightbox.dog-link').each(function(){
        let image_link = $(this).attr('src')
        if($(this).attr('class') == 'dog-img'){
          // console.log(image_link)
          dogInformation.Image.push(image_link)
        }
      })
      totalPages -= 1
      if(totalPages == 0){
        callback(dogInfoLinks, 0)
      }
      else{
        dogInfoLink(totalPages, callback)
        console.log(totalPages)
      }
    }
  })
}

let dogInformationHandler = function(arr, m){
  // console.log(arr[m])
  request(arr[m], function(error,response,body){
    if(!error){
      var name = ""
      var dob = ""
      var gender = ""
      var hdb = ""
      var breed = ""
      var $ = cheerio.load(body)
      var pageText = $('td','tbody tr').text()
      //Name
      var pointer = pageText.indexOf("Name:")
      var arr1 = pageText.substring(pointer).replace(/\n/gi, "").split(" ")
      //console.log(arr1)
      for(var i = 1; i < arr1.length; i++){
        if(arr1[i+1] == ""){
          name += arr1[i]
          break
        }
        else{
          name += arr1[i] + " "
        }
      }
      dogInformation.Name.push(breed)
      console.log(name)
      //Gender
      pointer = pageText.indexOf("Gender:")
      var arr1 = pageText.substring(pointer).replace(/\n/gi, "").split(" ")
      gender = arr1[1]
      dogInformation.Gender.push(gender)
      //HDB
      pointer = pageText.indexOf("HDB-approved:")
      var arr1 = pageText.substring(pointer).replace(/\n/gi, "").split(" ")
      hdb = arr1[1]
      dogInformation.hdbStatus.push(breed)
      //DOB
      pointer = pageText.indexOf("DOB:")
      var arr1 = pageText.substring(pointer).replace(/\n/gi, "").split(" ")
      for(var i = 1; i < arr1.length; i++){
        if(arr1[i+1] == ""){
          dob += arr1[i]
          break
        }
        else if(arr1[i] == ""){

        }
        else{
          dob += arr1[i] + " "
        }
      }
      dogInformation.Age.push(breed)
      //Breed
      pointer = pageText.indexOf("Breed:")
      var arr1 = pageText.substring(pointer).replace(/\n/gi, "").split(" ")
      for(var i = 1; i < arr1.length; i++){
        if(arr1[i+1] == ""){
          breed += arr1[i]
          break
        }
        else{
          breed += arr1[i] + " "
        }
      }
      dogInformation.Breed.push(breed)
      dogInformation.Source.push("AFS")
      //Move on
      m++
      if(m>arr.length-1){
        //create file with all information
        fs.writeFile('../data/dogInformationAFS.json', JSON.stringify(dogInformation), function(err){
            console.log('AFS Json file updated!')
        })
      }
      else{
        if(m%10 == 0){
          console.log('5 second pause')
          setTimeout(function(){
            dogInformationHandler(arr,m)
          },5000)
        }
        else{
          dogInformationHandler(arr, m)
        }
      }
    }
  })
}

exports.callThis()
// let x = function(q){
//   console.log('function x')
//   console.log(q)
// }
//
// let y = function(){
//   console.log('function y')
//   setTimeout(function(){
//     x('hello')
//   },1000)
// }
//
// y(x)
