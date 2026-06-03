const fs = require('fs');
let code = fs.readFileSync('server/controllers/team.ts', 'utf8');
code = code.replace(/req\.user\?\.tenantId!/g, '(req as any).tenantId');
code = code.replace(/req\.user\?\.tenantId/g, '(req as any).tenantId');
fs.writeFileSync('server/controllers/team.ts', code);
