import React, { PureComponent } from 'react';
import LoadingSpin from 'react-loading-spin';
import { EThree, IdentityAlreadyExistsError, LookupError } from '@virgilsecurity/e3kit';
import { StreamChat } from 'stream-chat';
import PinInput from 'react-pin-input';
import { post } from '../Http'

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
    const user_id = this.state.user.sub.replace('auth0|', 'auth0-');
    console.log('User id: ' + user_id);

    // authenticate user threw backend
    post("http://localhost:9000/authenticate", {
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

    const id = this.state.user.sub;

    const response = await post("http://localhost:9000/Auth0Manager-action", {
      id
    }, backendAuthToken);

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

    const response = await post("http://localhost:9000/stream-credentials", {
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
    const response = await post("http://localhost:9000/virgil-credentials", {}, backendAuthToken);
    const eThree = await EThree.initialize(() => response.token);

    // check if the user already backup his or her private key
    const user_id = this.state.user.sub.replace('auth0|', 'auth0-');
    const hasLocalPrivateKey = await eThree.hasLocalPrivateKey();

    try {
      await eThree.register();
      if (!hasLocalPrivateKey) {
        await eThree.backupPrivateKey(user_id);
        // await eThree.resetPrivateKeyBackup(user_id)
      }
    } catch (err) {
      try {
        if (err instanceof IdentityAlreadyExistsError) {
          try {
            await eThree.backupPrivateKey(user_id);
          } catch(error) { 
            // Do nothing the cloude already existed
          }
        }
        await eThree.restorePrivateKey(user_id);
      } catch (e) {
        console.log(e);
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
    
    if (this.state.receiver) {
      await this._handleStartChat();
    }
  };

  render() {
    if (this.state.pin == null)
    {
      return(
      <div style={{textAlign: "center",marginTop:"20%"}}> <PinInput 
            length={4} 
            initialValue="" 
            focus
            onChange={(value, index) => {}} 
            type="numeric" 
            style={{padding: '10px'}}  
            inputStyle={{borderColor: 'grey'}}
            inputFocusStyle={{borderColor: '#f08ef6'}}
            onComplete={(value, index) => {}}
          />
          <p> Enter a chat passcode </p>
          <p style={{padding: "20px"}}>You’ll be asked for this code each time you access a chat</p>
          </div>)
    }
    else if(this.state.receiver) {
      return (
        <div className="container">
          <div className='subtitle'>
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
    } else {
      return (
        <div className="container">
          <div className='subtitle'>
            <label>Thank you for registering, you will now recieve iRelate conversation links via email</label>
          </div> 
        </div>
      )
    }
  }
}