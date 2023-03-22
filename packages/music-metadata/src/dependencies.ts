import { execa } from 'execa'

export const getMissingPythonDependencies = async () => {
  try {
    await execa('pip3', ['check', 'metadata'], { cwd: __dirname })
    return []
  } catch (e) {
    if (e instanceof Error && 'stdout' in e && typeof e.stdout === 'string') {
      return [...e.stdout.matchAll(/requires ([^,]+),/g)].map((match) => match[1])
    } else {
      throw e
    }
  }
}
