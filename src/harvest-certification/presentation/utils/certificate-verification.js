export function certificateVerificationRoute(certificate) {
    if (certificate.verificationToken) {
        return {name: 'public-traceability', params: {token: certificate.verificationToken}};
    }
    return {name: 'public-traceability', params: {token: ''},
        query: {number: certificate.certificateNumber, hash: certificate.sha256Hash}};
}
