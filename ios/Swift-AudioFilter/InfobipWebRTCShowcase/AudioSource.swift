import Foundation
import AudioKit
import AudioKitEX
import SporthAudioKit
import SoundpipeAudioKit
import InfobipRTC
import AVFoundation
import os.log

class AudioSource {
    public func start() {}
}

class AudioSourcePcmData: AudioSource {
    private static let desiredFormat = AVAudioFormat(
            // WebRTC supports PCM 16-bit integer format
            commonFormat: AVAudioCommonFormat.pcmFormatInt16,
            // The sample rate can be arbitrary, but must be the one specified when instantiating the ADM
            sampleRate: Double(44100),
            // Mono audio
            channels: AVAudioChannelCount(1),
            interleaved: false
    )!
    // WebRTC expects 10ms of audio samples.
    private static let numSamples: UInt32 = UInt32(desiredFormat.sampleRate / 100)
    private static let bytesPerSample = 2 // 16 bits = 2 bytes

    private let buffer:  AVAudioPCMBuffer
    private let converter: AVAudioConverter!
    private let queue = DispatchQueue.init(label: "audio_player", qos: .userInteractive)
    private let adm: PcmBufferedAudioDeviceModule

    private var currentChunk = 0
    private let totalChunks: UInt32

    init(_ buffer:  AVAudioPCMBuffer) {
        adm = AudioDeviceModule.instance as! PcmBufferedAudioDeviceModule

        converter = AVAudioConverter(from: buffer.format, to: AudioSourcePcmData.desiredFormat)
        converter?.sampleRateConverterAlgorithm = AVSampleRateConverterAlgorithm_Normal
        converter?.sampleRateConverterQuality = .max

        self.buffer = AudioSourcePcmData.convertBuffer(buffer: buffer, withConverter: converter)
        self.totalChunks = self.buffer.frameLength / AudioSourcePcmData.numSamples
    }

    override func start() {
        super.start()

        Timer.scheduledTimer(timeInterval: 0.01, target: self, selector: #selector(AudioSourcePcmData.writeData), userInfo: nil, repeats: true)
    }

    static func convertBuffer(buffer: AVAudioPCMBuffer, withConverter: AVAudioConverter) -> AVAudioPCMBuffer {
        let inputCallback: AVAudioConverterInputBlock = { inNumPackets, outStatus in
            outStatus.pointee = .haveData
            return buffer
        }

        let convertedBuffer = AVAudioPCMBuffer(
                pcmFormat: withConverter.outputFormat,
                frameCapacity: buffer.frameLength
        )!

        var error: NSError?
        let status = withConverter.convert(to: convertedBuffer, error: &error, withInputFrom: inputCallback)
        assert(status != .error)

        return convertedBuffer
    }

    @objc private func writeData() {
        let data: Data = Data(
                buffer: UnsafeBufferPointer(
                        start: buffer.int16ChannelData![0].advanced(by: currentChunk * Int(AudioSourcePcmData.numSamples)),
                        count: Int(AudioSourcePcmData.numSamples)
                )
        )
        adm.write(data, samples: UInt32(data.count / AudioSourcePcmData.bytesPerSample))
        currentChunk += 1
        if (currentChunk >= totalChunks) {
            currentChunk = 0
        }
    }
}
