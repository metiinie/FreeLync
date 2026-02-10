"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminContext = void 0;
const common_1 = require("@nestjs/common");
exports.AdminContext = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.adminContext;
});
//# sourceMappingURL=admin-context.decorator.js.map