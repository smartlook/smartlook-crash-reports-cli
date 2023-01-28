import createLogger from 'debug'

export const debug = createLogger('smartlook-upload-cli:debug')

export const info = createLogger('smartlook-upload-cli')
info.color = '4'
info.enabled = true

export const error = createLogger('smartlook-upload-cli:error')
error.color = '1'
error.enabled = true
