import Messages from './Messages'

export default function(args: string[]): boolean {
  if (args.length === 0) {
    console.error(Messages.CONNECTION_STRING_MUST_BE_PROVIDED.red)
    
    return false
  }
  if (args.length > 1) {
    if (isNaN(args[1] as undefined)) {
      console.error(Messages.INVALID_TARGET_VERSION.red)

      return false
    }
  }

  return true
}
