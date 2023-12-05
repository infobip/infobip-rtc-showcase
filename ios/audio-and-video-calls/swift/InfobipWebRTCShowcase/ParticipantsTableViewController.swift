import Foundation
import UIKit
import InfobipRTC

extension CallController: UITableViewDelegate, UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return getInfobipRTCInstance().getActiveRoomCall()?.participants().count ?? 0
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "participantCell", for: indexPath)
        let participant = getInfobipRTCInstance().getActiveRoomCall()!.participants()[indexPath.row]
        if participant.state == .joining {
            cell.textLabel?.text = "\(participant.endpoint.identifier()) (joining)"
        } else {
            cell.textLabel?.text = participant.media.audio.muted ? "\(participant.endpoint.identifier()) (muted)" : participant.endpoint.identifier()
        }
        cell.textLabel?.textAlignment = .center
        return cell
    }
}
