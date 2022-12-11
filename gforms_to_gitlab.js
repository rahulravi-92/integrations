

/* :P Analytics Inspired by Engineering Inspired by:
    -  Create a new GitHub Issue from a Google Form submission - https://gist.github.com/bmcbride/62600e48274961819084 <- works for Github but I was able to change it to GitLab's API
    -  Google Form to Gitlab issue and slack on google app script  - https://gist.github.com/kwmt/e2b5b35c82a75fe18043be5ef0ae83fb
*/



// Place you GitLab access token below. PS: if you feel the token is exposed, use another hidden sheet to retrive the token from.

var glToken = "";

function onFormSubmit(e) {

  Logger.log(JSON.stringify(e));

  // For fetching email address 
  
  var emailAddress = e.values[1];

 //Used for retrieving the initial Forms sections. The Number in the square braces indicates the column of the Google Forms output sheet. 

  var requestTemplate = e.values[2];

  //Declaration of common variables that are shared between the form sections
  
  var requestTitle = e.values[3] + e.values[9] + e.values[17];
 
  var requestRequestedby = e.values[8] + e.values[16] + e.values[23];

  var requestPriority = e.values[13] + e.values[21]; 

 
  var requestExplanation = e.values[11] + e.values[19];

  var  attachmentsString = e.values[15] + e.values[22];



  var attachmentsMarkdown = new Array ();


  //Declaration for the Access request form
  
  var accessName = e.values[4];
  var accessEmailid = e.values[5];
  var accessOrg = e.values[6];
  var accessFinacc = e.values[7];
  
 

  //Declaration for the Looker request form

  
  var lookerBusinessimpact = e.values[10];
  
  var lookerTimeframe = e.values[12];
  var lookerURL = e.values[14];

  
  

  //Declaration for the insights request form
 
  var insightsBusinessquestion = e.values[18];
  var insightsDatause = e.values[20];
  


  // try to find out if the user exists already by searching for their email address
  var userOptions = {
    "method": "GET",
    "headers": {
        "PRIVATE-TOKEN": glToken,
    },
    "contentType": "application/json"
  };
  
  

  var response = UrlFetchApp.fetch("https://gitlab.com/api/v4/users?search=" + emailAddress, userOptions);
  Logger.log("User Search Response body: " + response.getContentText());

  var gitlabUsername = "";

  try{
    gitlabUsername = JSON.parse(response.getContentText())[0]["username"];
  } catch (e){
    Logger.log("exception:" + e);
  }
  Logger.log("gitlabUsername: " + gitlabUsername);

  // get our attachments if the attachmentsString is not empty
  
  //Logger.log(attachmentsString);

 

  if (attachmentsString && attachmentsString.length > 0) {
    // get our file attachments
    var attachments = attachmentsString.split(',');

    //Logger.log(attachments);
    
    for (index = 0; index < attachments.length; index++) {
      var gdriveID = attachments[index].split('=').pop();
      Logger.log(gdriveID);

      // payload for our attachment
      var form = {
        file : DriveApp.getFileById(gdriveID).getBlob()
      };

      var fileOptions = {
        "method": "POST",
        "headers": {
          "PRIVATE-TOKEN": glToken,
        },
        "payload": form
      };
     
     //Provide your team's GitLab repo directory for uploading attachments from the Form
     
      var response = UrlFetchApp.fetch("https://gitlab.com/api/v4/projects/teamdirectory/issue-request/uploads",fileOptions);
      Logger.log("Add Attachment Response body: " + response.getContentText());

      attachmentsMarkdown.push(JSON.parse(response.getContentText())["markdown"]);
    }    
  }
  
  //Logger.log(attachmentsMarkdown);

  
  
  // For Labelling issues based on the Priority provided in the Forms
  
  var labels = "bi-workflow::to-do";

  // set the priority label
  if (requestPriority.includes("P1")){
    labels += ",bi-priority::1-critical";
    priority = "P1";
  } else if (requestPriority.includes("P2")){
    labels += ",bi-priority::2-high";
    priority = "P2";
    
  } else if (requestPriority.includes("P3")){
    labels += ",bi-priority::3-medium";
    priority = "P3";

  } else if (requestPriority.includes("P4")){
    labels += ",bi-priority::4-low";
    priority = "P4";
  }
 

  var reqcreatedBy = 
              "Created via Google Form by email: " + emailAddress;

  // CC the user that created the issue in the description

  if (gitlabUsername && gitlabUsername.length > 0) {
    reqcreatedBy += " (@"+ gitlabUsername + ")\n\n" +
      "/cc @" + gitlabUsername;
  }

  // For creating the template based on the Forms sections

  // For access description

  var accessDescription = reqcreatedBy + 
    "\n\n## Summary\n\n" + requestTitle +
    "\n\n**Request Type:** \n\n" + requestTemplate +
    "\n\n**Initial Priority:** " + priority +
    "\n\n**Requested by:** " + requestRequestedby +
    "\n\n## User Name\n\n" + accessName +
    "\n\n## User Email\n\n" + accessEmailid +
    "\n\n## Team / Organization\n\n" + accessOrg +
    "\n\n## Require Financial Access\n\n" + accessFinacc ;
  
  //

  // For looker description

  var lookerDescription = reqcreatedBy + 
    "\n\n## Summary\n\n" + requestTitle +
    "\n\n**Request Type:** " + requestTemplate +
    "\n\n**Initial Priority:** " + priority +
    "\n\n**Requested by:** " + requestRequestedby +
    "\n\n##  Business Impact\n\n" +  lookerBusinessimpact +
    "\n\n## Detailed explanation\n\n"  + requestExplanation +
    "\n\n## What time frames are you looking at?\n\n" + lookerTimeframe +
    "\n\n## Looker URL\n\n" + lookerURL ;
  
  //

  // For insights description

  var insightsDescription = reqcreatedBy + 
    "\n\n## Summary\n\n" + requestTitle +
    "\n\n**Request Type:** " + requestTemplate +
    "\n\n**Initial Priority:** " + priority +
    "\n\n**Requested by:** " + requestRequestedby +
    "\n\n## What is the business question you are trying to answer?\n\n" + insightsBusinessquestion +
    "\n\n## Detailed explanation\n\n" + requestExplanation +
    "\n\n## Who will be using this data?\n\n" + insightsDatause;
  
  // End of issue template

  
   
   
  // Selecting the issue template base on the Form section tabs

  if (requestTemplate.includes("Access")){
    description = accessDescription;
  } if (requestTemplate.includes("Looker")){
    description = lookerDescription;
  } if (requestTemplate.includes("Insights")){
    description = insightsDescription;
  } 

  //add the markdown for our attachments
  for (index = 0; index < attachmentsMarkdown.length; index++) {
    description += "\n\n" + attachmentsMarkdown[index];
  }




  // set the label for the requestedby label for creating issue with team labels for ease of tracking

  if (requestRequestedby.includes("Prod")){
    labels += ",team-prod";
  }
  if (requestRequestedby.includes("QA")){
    labels += ",team-QA";
  }
  if (requestRequestedby.includes("OS")){
    labels += ",team-OS";
  }
  if (requestRequestedby.includes("Community")){
    labels += ",team-Community";
  }
  if (requestRequestedby.includes("Marketing")){
    labels += ",team-Marketing";
  }
  if (requestRequestedby.includes("KAM")){
    labels += ",team-KAM";
  }
  if (requestRequestedby.includes("Finance")){
    labels += ",team-Finance";
  }
  if (requestRequestedby.includes("Sales")){
    labels += ",team-Sales";
  }
  if (requestRequestedby.includes("Comex")){
    labels += ",team-Comex";
  }
  if (requestRequestedby.includes("People")){
    labels += ",team-People";
  }
  if (requestRequestedby.includes("Engineering")){
    labels += ",team-Engineering";
  }
  if (requestRequestedby.includes("Data science")){
    labels += ",team-datascience";
  }
  if (requestRequestedby.includes("Analytics")){
    labels += ",team-Analytics";
  }
  if (requestRequestedby.includes("Onboarding")){
    labels += ",team-onboarding";
  }
  

  // payload for our new issue
  var issuePayload = {
    "title": requestTitle,
    "description": description,
    "labels" : labels
  };
  
  //Logger.log(issuePayload);

  var issueOptions = {
    "method": "POST",
    "headers": {
        "PRIVATE-TOKEN": glToken,
    }, 
    "contentType": "application/json",
    "payload": JSON.stringify(issuePayload)
  };
  
  
  //Provide your team's GitLab repo directory for creating issues
  
  var response = UrlFetchApp.fetch("https://gitlab.com/api/v4/projects/teamdirectory/issue-request/issues", issueOptions);
  Logger.log("Create Issue Response body: " + response.getContentText());


  // Send an email to the person who created the issue to give them the link for tracking
  var subject = "Issue request created: " + JSON.parse(response.getContentText())["references"]["full"];
  var message = "Thank you for submitting a request, you can see your request here on GitLab:\n\n" + 
    JSON.parse(response.getContentText())["web_url"] + "\n\n" + 
    "Someone in the Analytics will get back to your shortly.";

  MailApp.sendEmail(emailAddress, subject, message, {name: 'Google Forms Bug Script', noReply : true});
  
  // Send an email to the your team for notifying that a request has been raised

  var temailAddress = "Yourteamemail@domain.com";
  var tsubject = "Issue request created: " + requestTemplate + "by " + requestRequestedby;
  var tmessage = requestRequestedby + " raised a request, click the request link below to take action:\n\n" + 
    JSON.parse(response.getContentText())["web_url"] ;
  
  MailApp.sendEmail(temailAddress, tsubject, tmessage, {name: 'Google Forms Issue Script team notification', noReply : true});
  
}
