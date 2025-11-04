library ieee;
use ieee.std_logic_1164.all;

entity priority_encoder is
    port (
        en : in std_logic;
        a_in : in std_logic_vector(7 downto 0);
        y_op : out std_logic_vector(2 downto 0)
    );
end priority_encoder;

architecture dataflow of priority_encoder is
    signal temp_result : std_logic_vector(2 downto 0);
begin
    y_op <= "111" when en = '1' and a_in(7) = '1' else
            "110" when en = '1' and a_in(6) = '1' and a_in(7) = '0' else
            "101" when en = '1' and a_in(5) = '1' and a_in(7 downto 6) = "00" else
            "100" when en = '1' and a_in(4) = '1' and a_in(7 downto 5) = "000" else
            "011" when en = '1' and a_in(3) = '1' and a_in(7 downto 4) = "0000" else
            "010" when en = '1' and a_in(2) = '1' and a_in(7 downto 3) = "00000" else
            "001" when en = '1' and a_in(1) = '1' and a_in(7 downto 2) = "000000" else
            "000" when en = '1' else
            "000";
    temp_result <= "111" when en = '1' and a_in(7) = '1' else
            "110" when en = '1' and a_in(6) = '1' and a_in(7) = '0' else
            "101" when en = '1' and a_in(5) = '1' and a_in(7 downto 6) = "00" else
            "100" when en = '1' and a_in(4) = '1' and a_in(7 downto 5) = "000" else
            "011" when en = '1' and a_in(3) = '1' and a_in(7 downto 4) = "0000" else
            "010" when en = '1' and a_in(2) = '1' and a_in(7 downto 3) = "00000" else
            "001" when en = '1' and a_in(1) = '1' and a_in(7 downto 2) = "000000" else
            "000" when en = '1' else
            "000";
end dataflow;