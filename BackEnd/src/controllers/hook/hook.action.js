import dotenv from 'dotenv';

dotenv.config();

const nodemailer = require('nodemailer');
const Auth0Manager = require("../../utils/Auth0Manager");

const createLink = (methods) => {
	// the application url
	const appurl = 'https://www.irelatetherapy.com/';
	// link to share the user chat page (comunicate with the registerate user)
	const usrl = `https://api.addthis.com/oexchange/0.8/forward/${methods}/offer?url=${appurl}`
	return usrl;
}

const mailto = (reciveremail, sender) => {

	// create nodemailer opject to send mails
	var transporter = nodemailer.createTransport({
		host: process.env.MAIL_HOST,
		port: process.env.MAIL_PORT,
		auth: {
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD
		}
	});

	// message options
	var mailOptions = {
		from: `${sender.name} (via IRelate) <${process.env.MAIL_USERNAME}>`,
		to: reciveremail,
		subject: 'New message recieved',
		html: `	
				<p>${sender.name} sent you a message</p>
				
				<a href="http://localhost:3000/?id=${sender.id}" target=_blank>
					Click here to see the message
				</a>

				<br/>
				<br/>
				<br/>
				<br/>

				<div style="text-align: left; padding: 4px;">
				<p>Help ${sender.name} help mothers you know <3 </p>
				<br/>
					<a href=${createLink("facebook")} target="_blank" rel="noopener noreferrer" style="padding: 4px;">
						<img src="https://cache.addthiscdn.com/icons/v3/thumbs/32x32/facebook.png" border="0" alt="Facebook" />
					</a>

					<a href=${createLink("messenger")} target="_blank" rel="noopener noreferrer" style="padding: 4px;">
						<img src="https://cache.addthiscdn.com/icons/v3/thumbs/32x32/messenger.png" border="0" alt="Facebook Messenger" />
					</a>

					<a href=${createLink("whatsapp")} target="_blank" rel="noopener noreferrer" style="padding: 4px;">
						<img src="https://cache.addthiscdn.com/icons/v3/thumbs/32x32/whatsapp.png" border="0" alt="WhatsApp" />
					</a>

					<a href=${createLink("twitter")} target="_blank" rel="noopener noreferrer" style="padding: 4px;">
						<img src="https://cache.addthiscdn.com/icons/v3/thumbs/32x32/twitter.png" border="0" alt="Twitter" />
					</a>
				</div>

			`
	};

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

exports.sendMail = async (req, res) => {
	const data = req.body;

	// check if the message is new
	if (data.type == "message.new") {
		// check if there is a member who is offline to ssend message to
		for (let i = 0; i < data.members.length; i++) {
			const member = data.members[i];
			if (member.user.online == false) {	
				const id = member.user.id.replace('auth0-', 'auth0|');
				await Auth0Manager.init();
				const users = await Auth0Manager.getUsers();
				const userdata = users.filter(item => item.user_id == id)[0];
				const reciveremail = userdata.email;

				const sender = data.user;
				mailto(reciveremail, sender);
			}
		}
	}
}
