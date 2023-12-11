import Foundation
import UIKit

extension ActiveCallController {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.texts.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "DataChannelTextCell", for: indexPath) as! DataChannelTextCell
        let dataChannelText = self.texts[indexPath.row]
        let timeLabel = self.dateFormatter.string(from: dataChannelText.date)
        var details = ""
        
        if let from = dataChannelText.from?.identifier() {
            details += "From \(from)"
            if let to = dataChannelText.to?.identifier() {
                details += " to \(to)"
            }
            details += " (\(timeLabel))"
        } else {
            details += "Broadcast (\(timeLabel))"
        }
        
        cell.detailsLabel.text = details
        cell.contentLabel.text = "\(dataChannelText.content) (\(dataChannelText.status.rawValue))"
        
        return cell
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return UITableView.automaticDimension
    }

    func tableView(_ tableView: UITableView, estimatedHeightForRowAt indexPath: IndexPath) -> CGFloat {
        return UITableView.automaticDimension
    }
}

class DataChannelTextCell: UITableViewCell {
    @IBOutlet weak var detailsLabel: UILabel!
    @IBOutlet weak var contentLabel: UILabel!
}
