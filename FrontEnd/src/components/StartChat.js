import React, { PureComponent } from 'react';
import LoadingSpin from 'react-loading-spin';
import CryptoJS from 'crypto-js';
import config from "../auth_config.json";

import { EThree, IdentityAlreadyExistsError, LookupError } from '@virgilsecurity/e3kit';
import { StreamChat } from 'stream-chat';
import PinInput from 'react-pin-input';
import { post } from '../Http'

const Loading = props => (
  <div className="container">
    <div className='subtitleloading'>
      <LoadingSpin
        duration = '2s'
        width = '15px'
        timingFunction = 'ease-in-out'
        size = '100px'
        primaryColor = 'blue'
        />
    </div> 
  </div>
)

export class StartChat extends PureComponent {
  constructor(props) {
    super(props);

    // get the reciver id from the url link
    const id = (new URLSearchParams(window.location.search)).get("id");

    this.state = {
      user: props.user,
      receiver: id,
      sender: props.user.nickname,
      stream: null,
      virgil: null,
      error: null,
      pin: null,
      load: false,
      verify: false,
      vpin: null
    }

    console.log("user", props.user);
    this._handleRegister();
  };

  // old Function used to set sender name
  // _handlesenderChange = (event) => {
  //   this.setState({ sender: event.target.value });
  // };

  // _handlereceiverChange = (event) => {
  //   this.setState({ receiver: event.target.value });
  // };

  _handleRegister = () => {
    // event.preventDefault();

    // replace | with - because in stream chat id not allowed to contains |
    var user_id = this.state.user.sub.replace('auth0|', 'auth0-');
    console.log('User id: ' + user_id);

    const key = config.encryptionKey;
    user_id = CryptoJS.AES.encrypt(user_id, key).toString();

    // authenticate user threw backend
    post(`${process.env.REACT_APP_DOMAIN}/authenticate`, {
        sender: user_id
      })
      .then(res => res.authToken)
      .then(this._connect);
  };

  _handleStartChat = async () => {
    try {
      // replace | with - because in stream chat id not allowed to contains |
      const user_id = this.state.user.sub.replace('auth0|', 'auth0-');


      // Get user name from auth0
      const Chatusers = await this.state.stream.client.queryUsers({
        id: this.state.receiver
      });

      const Chatuser = Chatusers.users[0];
      const recivername = Chatuser.name;

      // it is going to contains the names for both sender and reciever
      let members = [this.state.sender, recivername];
      members.sort();

      // it is going to contains the ids for both sender and reciever
      let memberids = [user_id, this.state.receiver];
      memberids.sort();

      // Create unique message id for every channel to keep data saved on stream chat
      const messageid = memberids.join('_');

      const channel = this.state.stream.client.channel('messaging', messageid, {
        image: `https://getstream.io/random_svg/?id=rapid-recipe-0&name=${members.join("+")}`,
        name: members.join(", "),
        members: memberids
      });

      // This function used to update the cahnnel without removing its data
      // you must supply the text otherwise the function will be blocked

      // await channel.update(
      //   {
      //     name: members.join(", "),
      //     image: `https://getstream.io/random_svg/?id=rapid-recipe-0&name=${members.join("+")}`,
      //   }
      // );

      // this function used to remove channel data
      // await channel.delete();

      // get the public virgil key
      const publicKeys = await this.state.virgil.eThree.lookupPublicKeys([user_id, this.state.receiver]);

      this.props.onConnect({
        sender: user_id,
        receiver: this.state.receiver,
        stream: {
          ...this.state.stream,
          channel
        },
        virgil: {
          ...this.state.virgil,
          publicKeys
        }
      });

    } catch (err) {
      if (err instanceof LookupError) {
        this.setState({
          error: 'Other user is not registered. Open another window and register that user.'
        })
      } else {
        this.setState({
          error: err.message
        });
      }
    }
  };

  _getUserData = async (backendAuthToken) => {
    // user data used to create chatstream account retrive from auth0
    const response = await post(`${process.env.REACT_APP_DOMAIN}/Auth0Manager-action`, {}, backendAuthToken);

    this.setState({
      sender: response.user.user_metadata.firstname
    });

    return {
      ...response
    };
  };

  _connectStream = async (backendAuthToken, userData) => {
    // user data used to create chatstream account retrive from auth0
    let picture = ''

    if (userData.user.user_metadata.picture) {
      picture = userData.user.user_metadata.picture;
    } else {
      picture = this.state.user.picture;
    }

    const data = {
      name: this.state.sender,
      image: picture
    };

    const response = await post(`${process.env.REACT_APP_DOMAIN}/stream-credentials`, {
      data
    }, backendAuthToken);

    const client = new StreamChat(response.apiKey);
    client.setUser(response.user, response.token);

    return {
      ...response,
      client
    };
  };

  _connectVirgil = async (backendAuthToken) => {
    const response = await post(`${process.env.REACT_APP_DOMAIN}/virgil-credentials`, {}, backendAuthToken);
    const eThree = await EThree.initialize(() => response.token);

    try {
      await eThree.register();
    } catch (err) {
      if (err instanceof IdentityAlreadyExistsError) {
        // already registered, ignore
      } else {
        console.log(err.message);
      }
    }

    const user_id = this.state.user.sub.replace('auth0|', 'auth0-');
    try{
      // Check if it the user first time to log in 
      // note: add an imposible writen password to check
      await eThree.restorePrivateKey('00000000qwe23123')
    } catch(err) {
      if(err.message.includes(`Cloud entry '${user_id}' doesn't exist`)) {
        this.setState({
          verify: true
        });
      }
    }

    return {
      ...response,
      eThree
    };
  };

  _connect = async (authToken) => {
    const userData = await this._getUserData(authToken);
    const stream = await this._connectStream(authToken, userData);
    const virgil = await this._connectVirgil(authToken);

    this.setState({
      stream,
      virgil
    })
  };

  _backupPrivateKey = async(pwd, length) => {
    if(!this.state.verify) {
      this.setState({ load: true })
      const eThree = this.state.virgil.eThree;
      const user_id = this.state.user.sub.replace('auth0|', 'auth0-');

      // check if the user already backup his or her private key
      const hasLocalPrivateKey = await eThree.hasLocalPrivateKey();

      try {
        if (hasLocalPrivateKey) {
          // try to backp user private key
          await eThree.backupPrivateKey(pwd);
          // await eThree.resetPrivateKeyBackup(pwd)
        } else {
          // restore user private key if user does not have one
          await eThree.restorePrivateKey(pwd);
        }
        
        // store user pin
        this.setState({ pin: pwd });

        if (this.state.receiver) {
          await this._handleStartChat();
        } else {
          this.props.onConnect({
            sender: user_id,
            virgil: {
              ...this.state.virgil
            }
          });
        }
      } catch(err) {
        if (err.message.includes(`Cloud entry '${user_id}' already exists`)) {
          // if the user already backup his or her private key
          // or user already has private key

          this.setState({ pin: pwd });
          if (this.state.receiver) {
            await this._handleStartChat();
          } else {
            this.props.onConnect({
              sender: user_id,
              virgil: {
                ...this.state.virgil
              }
            });
          }
        } else if (err.message.includes('Password from remote private key storage is invalid')) {
          this.setState({
            error: 'The password is wrong please try again.',
            load: false
          });
        } else {
          this.setState({
            error: err.message,
            load: false
          });
        }
      }
    } else {
      this.setState({
        vpin:pwd
      });
    }
  }

  _verifyPassword = async(pwd, length) => {
    const pin = this.state.vpin;
    if(pin === pwd) {
      this.setState({
        verify:false
      });
      await this._backupPrivateKey(pwd, length);
    } else {
      this.setState({
        error: 'The pin is mis mismatched. Please try again.'
      })
    }
  }

  render() {
    if (this.state.virgil == null){
      return (<Loading />)
    }
    else if (this.state.pin == null)
    {
      if(this.state.load) {
        return (<Loading />)
      } else {
        return (
          <div className="pinContainer"> 
            
            <p><label htmlFor="passcode">Enter a chat pass code</label></p>

            <PinInput 
              length={4} 
              initialValue=""
              focus
              inputmode="numeric" 
              style={{padding: '10px'}}  
              inputStyle={{borderColor: 'grey'}}
              inputFocusStyle={{borderColor: '#f08ef6'}}
              onComplete={(value, index) => {this._backupPrivateKey(value, index)}}
              name="passcode"
            />

            {this.state.verify && (
              <div>
                <p><label htmlFor="Verifypasscode">Please Verify Chat pass code</label></p>

                <PinInput 
                  length={4} 
                  initialValue=""
                  focus
                  inputmode="numeric" 
                  style={{padding: '10px'}}  
                  inputStyle={{borderColor: 'grey'}}
                  inputFocusStyle={{borderColor: '#f08ef6'}}
                  onComplete={(value, index) => {this._verifyPassword(value, index)}}
                  name="Verifypasscode"
                />
              </div>
            )}

            <p style={{padding: "20px"}}>Make sure you remember this code. You’ll be asked for this code each time you access a chat</p>
            <p className="danger">{this.state.error}</p>
          </div>
        )
      }
    }
    else if(this.state.receiver) {
      return (<Loading />)
    } else {
      return (
        <div className="container">
         
          <div className='subtitle'>
          <img style={{height: '97px',margin:'20px'}} alt='Irelate therapy Chat' src={require('../interface.svg')}/>
            <p>Thank you for registering, You will now recieve messages from prospect clients via your email.
              Once a message is recieved click on see message link to chat privately with your client.
              All conversations are secure . Your email is not shared 
            </p>
          </div> 
        </div>
      )
    }
  }
}