// ============================= 
//chatDemo ZETABASE  CODE
// (c) 2020 Zetabase
// ============================= 

// `zb` shell commands to set up user groups:
// 1. create sys text ""
// 2. put sys subusers/chatgroup/token/1 tokenchat
// 3. put sys subusers/chatgroup/maxnum 1000

// Shell command for creating table (jasonpy1/jasonpy1 account):
// create chat json "user read chatgroup,user append chatgroup uid @uid ts @time" uid lex ts natural
// 

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING:
// 
// variables  for Zetabase user information. 
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const PARENT_USER_ID = "48e2afe1-cd48-462f-af7d-7dbdc2d5102c"; //Zetabase user ID (automatically assigned at signup)
const SUBUSER_GROUP_ID = "chatgroup"; // The name of the subuser group for this app 
const SUBUSER_GROUP_TOKEN = "tokenchat"; // The signup token for the subuser group  for this app
const CHAT_TABLE_ID = "chat"; // The name of the table we made for this app

// These are global variables for storing information about the logged in user.
var currentUser = undefined; // To store user information (global state)
var currentClient = undefined; // To store our client (global state)

$(document).ready(function(){

  // ==================== 
  // SIGNUP FUNCTIONALITY
  // ==================== 

  $('#submit-signup').click(function(){
    // Get form values
    let signupHandle = $('#signup-id').val();
    let signupEmail = $('#signup-email').val();
    let signupMobile = $('#signup-mobile').val();
    let signupPass = $('#signup-pass').val();

    // Print form values
    console.log(`Signing up user: ${signupHandle} (${signupEmail} / ${signupMobile})`);
    
    // Call new subuser function with our parent ID, user group info, and signup information 
    Zb.newSubUser(PARENT_USER_ID, signupHandle, signupEmail, signupMobile, signupPass, SUBUSER_GROUP_TOKEN, SUBUSER_GROUP_ID, function(res, err) {
      if(res) {
        // Set globals and show the form for confirming a mobile number 
        currentUser = {"id": res, handle: signupHandle};
        console.log(`Current user: ${JSON.stringify(currentUser)}`);
        $('#confirm-code').show();
      } else {
        $('#signup-feedback').html(`Error: ${JSON.stringify(err.message)}`);
      }
    });
  });

  $('#submit-code').click(function(){
    // Get signup confirmation code and submit to verify user account
    let code = $('#signup-code').val();
    console.log(`Sending up signup code: ${code}`);
    // Submit confirmation code to server to verify user account
    Zb.confirmNewSubUser(PARENT_USER_ID, currentUser.id, code, function(res, err) {
      console.log(`User confirmed: ${currentUser.id}`);
    })
  });


  // ===================== 
  // SIGN IN FUNCTIONALITY
  // ===================== 

  $('#submit-signin').click(function(){
    // Get form values
    let signinHandle = $('#signin-id').val();
    let signinPass = $('#signin-pass').val();

    console.log(`Signing in with ${signinHandle} / ${signinPass}`);

    // Connect to Zetabase as a subuser (application-level user)
    Zb.connectSub(PARENT_USER_ID, signinHandle, signinPass, function(cli, err) {
      if(cli){
        $('#signin-feedback').html(""); // Clear any error messages ...
        // ... and set the global state.
        currentClient = cli;
        currentUser = {"id": cli.userId, handle: signinHandle};
        console.log(`Logged in user: ${JSON.stringify(currentUser)}`)
      } else {
        $('#signin-feedback').html(`Error: ${JSON.stringify(err.message)}`);
      }
    });
  });


  // ========================= 
  // VIEW CHATS FUNCTIONALITY
  // ========================= 

  
    // only pull chats when a user is logged in
    if(currentClient) {
      // Calculate the UNIX timestamp  in nanoseconds
      let currentTs = JSON.stringify(((new Date()).getTime() ) * 1000000);
      console.log(`Looking up chats : ${new Date(minTs/1000000)}`)
      // let msgl=[];
      // Create a Zetabase query object for the current timestamp 
      let qry = Zb.eq("ts", currentTs);
      // Run Zetabase query
      Zb.query(currentClient, CHAT_TABLE_ID, qry, function(res, err){
        if(!err) {
          console.log(`Query returned: ${JSON.stringify(res)}`);
          // Convert to HTML and update page 
          let html = renderChats(res);
          $('#content').html(html);
        } else {
          console.log(`Query error returned: ${JSON.stringify(err)}`);
        }
      })
    } else {
      console.log("."); // Do nothing! User is not logged in.
    }
 


  // ========================= 
  // SEND TWEETS FUNCTIONALITY
  // ========================= 

  $('#submit-msg').click(function(){
    // Make sure user is logged in and has typed a tweet
    if(!currentClient) {
      alert("Please log in first.");
      return;
    }
    let txt = $('#msg-text').val();
    if(txt.length == 0) {
      alert("Please enter a msg.")
      return;
    }

    // Create a key and a value to insert
    let msg = {"uid": currentUser.id, "text": txt};
    let key = `msg/${currentUser.id}/${(new Date()).getTime()}`;
    console.log(`Putting message data in key ${key}: ${JSON.stringify(msg)}`);
    
    // Do the insert!
    Zb.put(currentClient, CHAT_TABLE_ID, key, JSON.stringify(msg), function(res, err) {
      // Update UI based on result
      if(err) {
        $('#content').html(`Error: ${err.message}`);
      } else {
        console.log(`Successfully inserted Message ${key}.`)
        $('#msg-text').val('');
      }
    });
  });
});


// ===================== 
// RENDER CHATS AS HTML 
// ===================== 

function renderchats(data) {
  let html = "<ol>";
  for(let k in data) {
    let raw = data[k];
    let chats = JSON.parse(raw);
    let d = new Date(chats.ts / 1000000); // Convert nanosecond timestamp to Date
    html += "<li class=\"msg-text\">" + d.toLocaleString() + ": " + chats.text + "</li>"; 
  }
  html += "</ol>";
  return html;
}

