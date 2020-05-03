import React from 'react';
import { Channel, ChannelHeader, Chat, MessageList,  Window} from 'stream-chat-react';

import { MessageEncrypted } from './MessageEncrypted';
import { MessageInputEncrypted } from "./MessageInputEncrypted";
import NavBar from "./NavBar";
import { StartChat } from "./StartChat";
import 'stream-chat-react/dist/css/index.css';

export class EncryptedChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sender: props.user,
      receiver: null,
      stream: null,
      virgil: null
    };
  }

  _buildMessageEncrypted = (props) => {
    const newProps = {
      ...props,
      sender: this.state.sender,
      receiver: this.state.receiver,
      virgil: this.state.virgil
    };
    return <MessageEncrypted {...newProps}/>
  };

  onConnect = (chatData) => {
    this.setState(chatData);
  };

  render = () => {
    if (this.state.stream && this.state.virgil) {
      return (
        <Chat client={this.state.stream.client} theme={'messaging light'}>
          <Channel channel={this.state.stream.channel}>
            <Window>
              <NavBar virgil={this.state.virgil}  />
              <ChannelHeader/>             
              <MessageList Message={this._buildMessageEncrypted} />
              <MessageInputEncrypted virgil={this.state.virgil} channel={this.state.stream.channel}/>
            </Window>
          </Channel>
        </Chat>
      )
    } else {
      return <StartChat user={this.state.sender} onConnect={this.onConnect}/>
    }
  }
}

 