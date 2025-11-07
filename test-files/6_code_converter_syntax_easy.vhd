library ieee;
use ieee.std_logic_1164.all;

entity code_converter is
    port(
        x : in std_logic_vector(3 downto 0);
        y : out std_logic_vector(3 downto 0)
    );
end code_converter;

architecture behavioral of code_converter is
begin
    y(3) <= (x(3) and not x(2)) or (x(2) and x(0)) or (x(2) and x(1))
    y(2) <= (x(3) and not x(2)) or (x(2) and not x(0)) or (x(2) and x(1));
    y(1) <= x(3) or (not x(2) and x(1)) or (x(2) and not x(1) and x(0);
    y(0) <= x(0);
end behavioral;