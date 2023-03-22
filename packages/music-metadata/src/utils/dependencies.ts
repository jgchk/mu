import { execa } from 'execa'

const dependencies = ['mutagen', 'mediafile']

export const getMissingPythonDependencies = async () => {
  try {
    const { stdout } = await execa('pip3', ['show', ...dependencies])
    return dependencies.filter((dep) => !stdout.includes('Name: ' + dep))
  } catch (e) {
    return dependencies
  }
}
