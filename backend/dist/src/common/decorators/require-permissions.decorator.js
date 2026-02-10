"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermissions = void 0;
const common_1 = require("@nestjs/common");
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)('permissions', permissions);
exports.RequirePermissions = RequirePermissions;
//# sourceMappingURL=require-permissions.decorator.js.map