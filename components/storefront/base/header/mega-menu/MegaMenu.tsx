// MegaMenu.tsx

import { HeaderNavCategory } from "./types";
import { MegaMenuClient } from "./MegaMenuClient";

interface MegaMenuProps {
    navigation: HeaderNavCategory[];
}

export default function MegaMenu({
    navigation,
}: MegaMenuProps) {
    return <MegaMenuClient navigation={navigation} />;
}