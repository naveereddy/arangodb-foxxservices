'use strict';

module.context.use('/business', require('./routes/business'), 'business');
module.context.use('/jobs', require('./routes/jobs'), 'jobs');
module.context.use('/categories', require('./routes/categories'), 'categories');
module.context.use('/users', require('./routes/users'), 'users');
module.context.use('/auths', require('./routes/auths'), 'auths');