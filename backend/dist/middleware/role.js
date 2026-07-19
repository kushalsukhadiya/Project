"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. Authenticated session required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}].`
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
