import { MessageInput } from "stream-chat-react";
import React, { PureComponent } from 'react';

// const Csendbutton = props => (
//   <div >
//     <span className="sendContainer">
//       <svg version="1.1" fill="darkcyan" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 535.5 535.5">
//         <g>
//           <g id="send">
//             <polygon points="0,497.25 535.5,267.75 0,38.25 0,216.75 382.5,267.75 0,318.75"/>
//           </g>
//         </g>
//       </svg>
//     </span>
//   </div>
// )

export class MessageInputEncrypted extends PureComponent {
  sendMessageEncrypted = async (data) => {
    const encryptedText = await this.props.virgil.eThree.encrypt(data.text, this.props.virgil.publicKeys);
    await this.props.channel.sendMessage({
      ...data,
      text: encryptedText
    });
  };

  render = () => {
    const newProps = {
      ...this.props,
      sendMessage: this.sendMessageEncrypted,
      focus: true
    };

    // SendButton={Csendbutton}
    return <MessageInput {...newProps} />
  }
}
