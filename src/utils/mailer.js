const SibApiV3Sdk = require('sib-api-v3-sdk');

let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SMTP_KEY;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

/* Send the user a sign up confirmation mail */
const sendSignUpMail = async ({ name, email }) => {
	try {
		sendSmtpEmail.subject = 'Jtaclogs signup confirmation';
		sendSmtpEmail.to = [{ email: `${email}`, name: `${name}` }];
		sendSmtpEmail.replyTo = {
			email: process.env.SENDER,
			name: 'Jtaclogs admin'
		};
		sendSmtpEmail.htmlContent = `<html>
				\
				<body>
					\<h3>Succesful sign up for ${name} with Jtaclogs!</h3>\
					<div>
						Thanks for signing up. Be aware that the app running on Jtaclogs is
						using a third party API: unogsNg from ${process.env.RAPIDAPI} for fetching the Netflix content. We do not
                        control the outcome or sudden changes made by this third party.
                        <br />
                        We also would like to point out that for some countries there is no Netflix data available. Which countries this concerns is unclear at the moment. Should you not be able to find the country of your choice, then there probably is no content available for it.
						<br />
						<br />
						We hope you enjoy our app and its content.
						<br />
						<br />
						Greetings from the Jatclogs team! (...which is actually just one
						person)
					</div>
					\
				</body>
				\
			</html>`;
		sendSmtpEmail.sender = {
			name: 'Jtaclogs admin',
			email: process.env.SENDER
		};

		const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
		return response;
	} catch (error) {
		console.log('sendSignUpMail error____>', error);
	}
};

/* Emails the user a link for resetting the password  */
const resetPasswordMail = async ({ email, resetLink }) => {
	const time = new Date().getTime() + 900000; // adds 15 min
	const date = new Date(time);
	try {
		sendSmtpEmail.subject = 'Jtaclogs password reset';
		sendSmtpEmail.to = [{ email: `${email}` }];
		sendSmtpEmail.replyTo = {
			email: process.env.SENDER,
			name: 'Jtaclogs admin'
		};
		sendSmtpEmail.htmlContent = `<html>
        \
        <body>
            \<h3>Password reset for ${email}</h3>\
            <br />
            <div>
                <p>Click this <a href="${resetLink}">link</a> to reset your password.</p>
                <p>This link is valid for 15 min untill: ${date.toString()}.</p>
            </div>
            \
        </body>
        \
    </html>`;
		sendSmtpEmail.sender = {
			name: 'Jtaclogs admin',
			email: process.env.SENDER
		};

		const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
		return response;
	} catch (error) {
		console.log('resetPasswordMail error____>', error);
	}
};

exports.sendSignUpMail = sendSignUpMail;
exports.resetPasswordMail = resetPasswordMail;
