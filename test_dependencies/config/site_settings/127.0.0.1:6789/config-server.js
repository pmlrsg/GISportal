GLOBAL.config['127.0.0.1:6789'] = {
   auth: {
      google: {
         scope: 'https://www.googleapis.com/auth/userinfo.email',
         clientid: '771978882869-ov72e4gql205io6pprvr0eja7q3o0j91.apps.googleusercontent.com',
         clientsecret: 'kZBX8GjpLsIO0cGBfJ1np5rx',
         callback: 'http://127.0.0.1:6789/app/user/auth/google/callback',
         prompt: 'select_account'
      }
   },
   admins: ['an.admin@pml.ac.uk', 'nik@pml.ac.uk'],
   tokens: {
      'zxc': 'guest',
      'asd': 'a.user@pml.ac.uk',
      'qwe': 'an.admin@pml.ac.uk'
   },
   logDir: 'logs/test',
   cssFile: "GISportal"
};