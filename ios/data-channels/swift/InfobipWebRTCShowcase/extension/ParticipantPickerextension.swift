import Foundation
import UIKit

extension ActiveCallController {
    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }

    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        return participants.count
    }

    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        return participants[row]
    }

    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        if participants.count == 0 {
            return
        }
        
        self.toInput.text = participants[row]
    }

    @objc func doneButtonTapped() {
        self.toInput.resignFirstResponder()
    }
}
